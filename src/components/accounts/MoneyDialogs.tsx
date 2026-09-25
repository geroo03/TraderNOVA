"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { CopyField } from "@/components/ui/CopyField";
import { Dialog, Field, fieldCls } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";
import type { MsIconName } from "@/components/ui/ms-icon-names";
import { useTrading } from "@/components/trading/TradingProvider";
import { FundingNotice } from "./FundingNotice";
import { depositDetails as d, type LinkedAccount } from "@/lib/accounts";
import { formatDecimal } from "@/lib/format";
import { caucion, dollarRates } from "@/lib/mock-data";
import { pushTreasury, useLinkedAccountsStore } from "@/lib/store/hooks";
import { currentUser } from "@/lib/mock-data";
import { nowTime } from "@/lib/download";

/** Retiros hasta este monto se procesan solos (STP); los mayores pasan por aprobación de Tesorería. */
export const STP_LIMIT = { ARS: 1_000_000, USD: 1_000 } as const;
/** En la demo el plazo de la caución corre acelerado. */
const CAUCION_DAY_MS = 60_000;

function Restricted({ text }: { text: string }) {
  return <p role="alert" className="rounded-lg bg-alert/10 p-3 text-xs text-negative">{text}</p>;
}

export type MoneyAction = "deposit" | "withdraw" | "mep" | "caucion" | "link";

const mep = dollarRates.find((r) => r.label === "MEP")?.price ?? 1_285.4;
const money = (v: number, c: "ARS" | "USD") => `${c === "USD" ? "U$S " : "$"}${formatDecimal(v)}`;

function DepositBody({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-2 sm:grid-cols-2">
        <CopyField label="CBU receptora" value={d.cbu} />
        <CopyField label="Alias CBU" value={d.alias} />
      </div>
      <p className="text-xs text-fg-subtle">
        Transferí desde una cuenta a tu nombre a {d.holder} (CUIT {d.cuit}) y avisanos acá para acreditarlo al instante.
      </p>
      <FundingNotice onDone={onClose} />
    </div>
  );
}

function WithdrawBody({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const { account, addMovement, accountRestriction } = useTrading();
  const [accounts] = useLinkedAccountsStore();
  const [accId, setAccId] = useState(accounts[0]?.id ?? "");
  const acc = accounts.find((a) => a.id === accId);
  const cur = acc?.currency ?? "ARS";
  const max = cur === "USD" ? account.availableUsd : account.availableArs;
  const [amount, setAmount] = useState(0);
  const error = amount <= 0 ? null : amount > max ? `Supera tu disponible (${money(max, cur)}).` : null;

  const manual = amount > STP_LIMIT[cur];

  function submit() {
    if (!acc || amount <= 0 || error || accountRestriction) return;
    const common = {
      kind: "withdrawal" as const,
      title: cur === "USD" ? "Retiro a cuenta en dólares" : "Retiro a cuenta bancaria",
      counterparty: `${acc.bank} · CBU ***${acc.last4}`,
      amount: -amount,
      currency: cur,
      status: "En proceso" as const,
    };
    if (manual) {
      // Queda "En proceso" hasta que Tesorería lo apruebe o rechace desde la vista staff.
      const mov = addMovement(common);
      pushTreasury({
        item: {
          id: `TRX-${mov.id.slice(4)}`,
          kind: "RETIRO",
          client: currentUser.fullName,
          account: currentUser.accountNumber.split("-")[0],
          amount,
          currency: cur,
          bank: `${acc.bank} · CBU ***${acc.last4}`,
          cuitMatch: true,
          risk: "Monto > STP",
          movementId: mov.id,
        },
      });
      toast({ title: "Retiro en revisión", text: `${money(amount, cur)} supera el límite automático: lo aprueba Tesorería (vista staff).`, tone: "primary" });
    } else {
      addMovement(common, { settleInMs: 10_000 });
      pushTreasury({ log: { time: nowTime(), operator: "Bot STP COELSA", op: `Retiro automático · ${currentUser.fullName}`, amount: `-${money(amount, cur)}`, ref: "STP", status: "Transferido" } });
      toast({ title: "Retiro solicitado", text: `${money(amount, cur)} a ${acc.bank}. Llega en menos de 10 minutos.` });
    }
    onClose();
  }

  if (accountRestriction) return <Restricted text={accountRestriction} />;

  return (
    <div className="flex flex-col gap-3">
      <Field label="Cuenta destino">
        <select value={accId} onChange={(e) => { setAccId(e.target.value); setAmount(0); }} className={fieldCls}>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.bank} · {a.currency} ***{a.last4}
            </option>
          ))}
        </select>
      </Field>
      <Field label={`Monto (${cur})`} hint={`Disponible para retirar: ${money(max, cur)}`} error={error}>
        <input type="number" min={0} value={amount || ""} onChange={(e) => setAmount(Number(e.target.value))} className={`${fieldCls} font-mono text-lg`} placeholder="0,00" />
      </Field>
      <div className="flex gap-1">
        {[25, 50, 100].map((p) => (
          <button key={p} type="button" onClick={() => setAmount(Math.floor(max * p) / 100)} className="text-label rounded bg-surface-higher px-2 py-1 text-fg-muted hover:text-fg">
            {p === 100 ? "Todo" : `${p}%`}
          </button>
        ))}
      </div>
      <p className="flex justify-between rounded-lg bg-surface-high p-2 font-mono text-xs">
        <span>Costo por extracción</span>
        <span className="text-positive">$0,00</span>
      </p>
      <p className="text-[11px] text-fg-subtle">
        {manual
          ? `Supera ${money(STP_LIMIT[cur], cur)}: queda pendiente hasta que Tesorería lo apruebe.`
          : `Hasta ${money(STP_LIMIT[cur], cur)} se transfiere automáticamente.`}
      </p>
      <Button icon="north_east" disabled={amount <= 0 || !!error} onClick={submit}>
        {manual ? "Solicitar retiro" : "Confirmar retiro"}
      </Button>
    </div>
  );
}

function MepBody({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const { account, addMovement, simMode, accountRestriction } = useTrading();
  const [ars, setArs] = useState(100_000);
  const usd = Math.floor((ars / mep) * 100) / 100;
  const error = ars > account.availableArs ? `Supera tu disponible (${money(account.availableArs, "ARS")}).` : null;

  function submit() {
    if (ars <= 0 || error) return;
    const common = { kind: "mep" as const, title: "Compra de dólar MEP (AL30 / AL30D)", counterparty: `Tipo de cambio MEP ${money(mep, "ARS")}`, status: "Liquidado T+1" as const };
    addMovement({ ...common, amount: -ars, currency: "ARS" });
    addMovement({ ...common, amount: usd, currency: "USD" });
    toast({ title: "Compraste dólar MEP", text: `${money(ars, "ARS")} → U$S ${formatDecimal(usd)} en tu cuenta en dólares.` });
    onClose();
  }

  if (accountRestriction) return <Restricted text={accountRestriction} />;

  return (
    <div className="flex flex-col gap-3">
      {simMode && <p className="rounded-lg bg-primary/10 p-2 text-xs text-primary">La compra de MEP se hace sobre tu cuenta real (la simulación solo cubre órdenes).</p>}
      <p className="flex justify-between rounded-lg bg-surface-high p-3 text-sm">
        <span className="text-fg-subtle">Cotización MEP</span>
        <span className="font-mono font-semibold">{money(mep, "ARS")}</span>
      </p>
      <Field label="Pesos a convertir" hint={`Disponible: ${money(account.availableArs, "ARS")}`} error={error}>
        <input type="number" min={0} value={ars || ""} onChange={(e) => setArs(Number(e.target.value))} className={`${fieldCls} font-mono text-lg`} />
      </Field>
      <p className="flex items-baseline justify-between">
        <span className="text-xs text-fg-subtle">Recibís aprox.</span>
        <span className="font-mono text-2xl font-bold text-positive">U$S {formatDecimal(usd)}</span>
      </p>
      <p className="text-[11px] text-fg-subtle">Se compra AL30 en pesos y se vende AL30D en dólares, respetando el parking regulatorio. Liquidación T+1.</p>
      <Button variant="buy" icon="currency_exchange" disabled={ars <= 0 || !!error} onClick={submit}>
        Comprar U$S {formatDecimal(usd)}
      </Button>
    </div>
  );
}

function CaucionBody({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const { account, addMovement, accountRestriction } = useTrading();
  const [amount, setAmount] = useState(Math.min(caucion.availableToPlace, Math.floor(account.availableArs)));
  const [days, setDays] = useState(1);
  const interest = (amount * (caucion.tna / 100) * days) / 365;
  const error = amount > account.availableArs ? `Supera tu disponible (${money(account.availableArs, "ARS")}).` : null;

  function submit() {
    if (amount <= 0 || error) return;
    addMovement(
      {
        kind: "caucion",
        title: `Caución colocadora ${days} día${days > 1 ? "s" : ""} · TNA ${formatDecimal(caucion.tna)}%`,
        counterparty: `Interés estimado ${money(interest, "ARS")}`,
        amount: -amount,
        currency: "ARS",
        status: "Colocada",
        payout: Math.round((amount + interest) * 100) / 100,
      },
      { maturesInMs: days * CAUCION_DAY_MS },
    );
    toast({ title: "Caución colocada", text: `${money(amount, "ARS")} a ${days} día(s). Cobrás ${money(interest, "ARS")} de interés al vencimiento.` });
    onClose();
  }

  if (accountRestriction) return <Restricted text={accountRestriction} />;

  return (
    <div className="flex flex-col gap-3">
      <Field label="Monto a colocar (ARS)" hint={`Disponible: ${money(account.availableArs, "ARS")}`} error={error}>
        <input type="number" min={0} value={amount || ""} onChange={(e) => setAmount(Number(e.target.value))} className={`${fieldCls} font-mono text-lg`} />
      </Field>
      <div role="group" aria-label="Plazo" className="grid grid-cols-3 gap-1">
        {[1, 7, 30].map((dd) => (
          <button key={dd} type="button" aria-pressed={days === dd} onClick={() => setDays(dd)} className={`rounded-lg py-2 text-xs font-semibold ${days === dd ? "bg-primary-strong text-on-primary" : "bg-surface-high text-fg-muted"}`}>
            {dd} día{dd > 1 ? "s" : ""}
          </button>
        ))}
      </div>
      <dl className="flex flex-col gap-1 rounded-lg bg-surface-lowest p-3 font-mono text-xs">
        <div className="flex justify-between"><dt className="text-fg-subtle">TNA</dt><dd>{formatDecimal(caucion.tna)}%</dd></div>
        <div className="flex justify-between"><dt className="text-fg-subtle">Interés estimado</dt><dd className="text-positive">+{money(interest, "ARS")}</dd></div>
        <div className="flex justify-between border-t border-surface-higher pt-1 font-semibold"><dt>Total al vencimiento</dt><dd>{money(amount + interest, "ARS")}</dd></div>
      </dl>
      <p className="text-[11px] text-fg-subtle">Demo: el plazo corre acelerado (1 día = 1 minuto). Al vencer se acreditan capital e interés.</p>
      <Button icon="savings" disabled={amount <= 0 || !!error} onClick={submit}>
        Colocar caución
      </Button>
    </div>
  );
}

const BANKS = ["Banco Galicia", "BBVA Argentina", "Banco Santander", "Banco Macro", "Banco Nación", "Banco Provincia", "Brubank", "Mercado Pago"];

function LinkBody({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const [, setAccounts] = useLinkedAccountsStore();
  const [bank, setBank] = useState(BANKS[2]);
  const [currency, setCurrency] = useState<"ARS" | "USD">("ARS");
  const [cbu, setCbu] = useState("");
  const [alias, setAlias] = useState("");
  const [touched, setTouched] = useState(false);
  const cbuError = /^\d{22}$/.test(cbu) ? null : "La CBU/CVU tiene 22 dígitos.";
  const aliasError = /^[a-zA-Z0-9.-]{6,20}$/.test(alias) ? null : "El alias tiene entre 6 y 20 caracteres (letras, números, punto o guion).";

  function submit() {
    setTouched(true);
    if (cbuError || aliasError) return;
    const acc: LinkedAccount = {
      id: `acc-${cbu.slice(-6)}`,
      bank,
      initials: bank.replace(/^Banco /, "").slice(0, 2).toUpperCase(),
      type: bank === "Mercado Pago" || bank === "Brubank" ? "Cuenta virtual (CVU)" : "Caja de Ahorro",
      currency,
      last4: cbu.slice(-4),
      alias: alias.toLowerCase(),
    };
    setAccounts((prev) => [...prev.filter((a) => a.id !== acc.id), acc]);
    toast({ title: "Cuenta vinculada", text: `${bank} ***${acc.last4}. Titularidad verificada por COELSA.` });
    onClose();
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Banco / billetera">
          <select value={bank} onChange={(e) => setBank(e.target.value)} className={fieldCls}>
            {BANKS.map((b) => <option key={b}>{b}</option>)}
          </select>
        </Field>
        <Field label="Moneda">
          <select value={currency} onChange={(e) => setCurrency(e.target.value as "ARS" | "USD")} className={fieldCls}>
            <option value="ARS">Pesos (ARS)</option>
            <option value="USD">Dólares (USD)</option>
          </select>
        </Field>
      </div>
      <Field label="CBU / CVU" error={touched ? cbuError : null} hint="22 dígitos, sin espacios">
        <input inputMode="numeric" value={cbu} onChange={(e) => setCbu(e.target.value.replace(/\D/g, "").slice(0, 22))} className={`${fieldCls} font-mono`} placeholder="0000000000000000000000" />
      </Field>
      <Field label="Alias" error={touched ? aliasError : null}>
        <input value={alias} onChange={(e) => setAlias(e.target.value)} className={`${fieldCls} font-mono`} placeholder="facundo.rossi.banco" />
      </Field>
      <p className="text-[11px] text-fg-subtle">Solo se aceptan cuentas a tu nombre: validamos el CUIT del titular contra COELSA.</p>
      <Button icon="add" onClick={submit}>
        Vincular cuenta
      </Button>
    </div>
  );
}

const META: Record<MoneyAction, { title: string; description: string }> = {
  deposit: { title: "Ingresar dinero", description: "Transferencia inmediata 24/7 vía COELSA" },
  withdraw: { title: "Retirar fondos", description: "A tus cuentas declaradas, sin costo" },
  mep: { title: "Comprar dólar MEP", description: "Pesos a dólares en tu cuenta comitente" },
  caucion: { title: "Caución colocadora", description: "Rentabilizá tus pesos a corto plazo" },
  link: { title: "Vincular cuenta bancaria", description: "Para depósitos y retiros" },
};

export function MoneyDialog({ action, open, onClose }: { action: MoneyAction; open: boolean; onClose: () => void }) {
  const Body = { deposit: DepositBody, withdraw: WithdrawBody, mep: MepBody, caucion: CaucionBody, link: LinkBody }[action];
  return (
    <Dialog open={open} onClose={onClose} title={META[action].title} description={META[action].description}>
      <Body onClose={onClose} />
    </Dialog>
  );
}

/** Botón que abre el diálogo de dinero correspondiente; usable desde páginas de servidor. */
export function MoneyActionButton({
  action,
  children,
  variant = "primary",
  size = "md",
  icon,
  className,
}: {
  action: MoneyAction;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "buy";
  size?: "sm" | "md" | "lg";
  icon?: MsIconName;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={variant} size={size} icon={icon} className={className} onClick={() => setOpen(true)}>
        {children}
      </Button>
      <MoneyDialog action={action} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
