"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useTrading } from "@/components/trading/TradingProvider";
import { formatDecimal } from "@/lib/format";
import { useLinkedAccountsStore } from "@/lib/store/hooks";

const QUICK = [100_000, 500_000, 1_000_000, 5_000_000];
const inputCls = "w-full rounded-lg bg-surface-high px-3 py-2 text-sm text-fg outline-none focus-visible:ring-2 focus-visible:ring-primary";
/** Tiempo de acreditación simulado (el "Fondeo Flash" promete 42 s; la demo lo acorta). */
const SETTLE_MS = 8_000;

/** Aviso de transferencia enviada: registra un depósito "En proceso" que se acredita a los segundos. */
export function FundingNotice({ onDone }: { onDone?: () => void }) {
  const toast = useToast();
  const { addMovement } = useTrading();
  const [accounts] = useLinkedAccountsStore();
  const ars = accounts.filter((a) => a.currency === "ARS");
  const [amount, setAmount] = useState(500_000);
  const [account, setAccount] = useState(ars[0]?.id ?? "");
  const [reference, setReference] = useState("");
  const [notify, setNotify] = useState(true);
  const [sent, setSent] = useState<string | null>(null);
  const invalid = !(amount > 0) || !account;

  function submit(e: FormEvent) {
    e.preventDefault();
    if (invalid) return;
    const acc = accounts.find((a) => a.id === account);
    addMovement({
      kind: "deposit",
      title: "Depósito bancario inmediato",
      counterparty: `${acc?.bank} · ${acc?.type} ***${acc?.last4}${reference ? ` · Comp. ${reference}` : ""}`,
      amount,
      currency: "ARS",
      status: "En proceso",
    }, { settleInMs: SETTLE_MS });
    toast({ title: "Aviso registrado", text: `Conciliando $${formatDecimal(amount)} desde ${acc?.bank}. Se acredita en unos segundos.`, tone: "primary" });
    setSent(acc?.bank ?? "");
    onDone?.();
  }

  if (sent !== null) {
    return (
      <div role="status" className="flex flex-col gap-2 rounded-lg bg-positive/10 p-4 text-sm">
        <p className="font-semibold text-positive">Aviso registrado</p>
        <p className="text-fg-muted">
          Vamos a conciliar ${formatDecimal(amount)} desde {sent}. {notify ? "Te avisamos por WhatsApp y correo cuando se acredite." : ""} Seguí el estado en el historial de movimientos.
        </p>
        <Button variant="secondary" size="sm" className="self-start" onClick={() => setSent(null)}>
          Cargar otro aviso
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-label uppercase text-fg-subtle">Monto a ingresar (ARS)</span>
        <input type="number" min={1} value={amount} onChange={(e) => setAmount(Number(e.target.value))} className={`${inputCls} font-mono text-lg`} />
      </label>
      <div className="flex flex-wrap gap-1">
        {QUICK.map((q) => (
          <button key={q} type="button" onClick={() => setAmount(q)} className="text-label rounded bg-surface-higher px-2 py-1 text-fg-muted hover:text-fg">
            ${formatDecimal(q).replace(/,00$/, "")}
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-label uppercase text-fg-subtle">Cuenta de origen</span>
          <select value={account} onChange={(e) => setAccount(e.target.value)} className={inputCls}>
            {ars.map((a) => (
              <option key={a.id} value={a.id}>
                {a.bank} · {a.type} ***{a.last4}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-label uppercase text-fg-subtle">Nº comprobante (opcional)</span>
          <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Ej: 0092817263" className={`${inputCls} font-mono`} />
        </label>
      </div>
      <label className="flex items-center gap-2 text-xs text-fg-muted">
        <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="accent-primary-strong" />
        Notificarme por WhatsApp y correo cuando se acredite
      </label>
      <Button type="submit" disabled={invalid} icon="send" className="self-start">
        Notificar transferencia enviada
      </Button>
    </form>
  );
}
