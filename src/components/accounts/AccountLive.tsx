"use client";

import { Badge } from "@/components/ui/Badge";
import { Stat } from "@/components/ui/Page";
import { MsIcon } from "@/components/ui/MsIcon";
import { useToast } from "@/components/ui/Toast";
import { useTrading } from "@/components/trading/TradingProvider";
import { MoneyActionButton } from "./MoneyDialogs";
import { formatDecimal } from "@/lib/format";
import { useLinkedAccountsStore } from "@/lib/store/hooks";

/** Saldos de la cuenta real, derivados de movimientos y órdenes. */
export function AccountStats() {
  const { account, movements } = useTrading();
  const pending = movements.filter((m) => m.status === "En proceso" && m.amount > 0 && !m.historic);
  const pendingArs = pending.filter((m) => m.currency === "ARS").reduce((a, m) => a + m.amount, 0);
  return (
    <>
      <Stat label="Disponible ARS (inmediato)" value={`$${formatDecimal(account.availableArs)}`} badge={<Badge tone="positive">T+0</Badge>} hint={account.reservedArs ? `$${formatDecimal(account.reservedArs)} comprometidos en órdenes` : "Listo para operar o retirar"} />
      <Stat label="Disponible USD (MEP)" value={`U$S ${formatDecimal(account.availableUsd)}`} badge={<Badge tone="primary">Cable listo</Badge>} hint="Transferible a cuenta en USD" />
      <Stat
        label="Fondos en liquidación"
        value={`$${formatDecimal(pendingArs)}`}
        badge={<Badge tone={pending.length ? "primary" : "neutral"}>{pending.length ? "Acreditando" : "T+1"}</Badge>}
        hint={pending.length ? `${pending.length} depósito(s) en conciliación` : "Sin operaciones pendientes"}
      />
    </>
  );
}

export function LinkedAccountsList() {
  const toast = useToast();
  const [accounts, setAccounts] = useLinkedAccountsStore();

  function makeDefault(id: string) {
    setAccounts((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));
    toast({ title: "Cuenta predeterminada actualizada" });
  }

  function unlink(id: string) {
    const acc = accounts.find((a) => a.id === id);
    if (!acc || !window.confirm(`¿Desvincular ${acc.bank} ***${acc.last4}?`)) return;
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    toast({ title: "Cuenta desvinculada", text: `${acc.bank} ***${acc.last4}`, tone: "neutral" });
  }

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-2">
        {accounts.map((a) => (
          <li key={a.id} className="rounded-lg bg-surface-high p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-md bg-primary-strong text-xs font-bold text-on-primary">{a.initials}</span>
                <span>
                  <span className="block text-sm font-semibold">{a.bank}</span>
                  <span className="text-[11px] text-fg-subtle">
                    {a.type} en {a.currency === "ARS" ? "pesos" : "dólares"} ({a.currency})
                  </span>
                </span>
              </span>
              <Badge tone={a.isDefault ? "positive" : "primary"}>{a.isDefault ? "Predeterminada" : a.currency === "USD" ? "Dólar MEP" : "Secundaria"}</Badge>
            </div>
            <dl className="grid grid-cols-2 gap-2 pt-2 font-mono text-xs">
              <div>
                <dt className="text-label text-fg-subtle">CBU</dt>
                <dd>•••• •••• •••• {a.last4}</dd>
              </div>
              <div>
                <dt className="text-label text-fg-subtle">Alias</dt>
                <dd className="truncate">{a.alias}</dd>
              </div>
            </dl>
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <p className="text-label flex items-center gap-1 text-positive">
                <MsIcon name="verified" size={12} /> Titular verificado por COELSA
              </p>
              <span className="flex gap-2">
                {!a.isDefault && (
                  <button type="button" onClick={() => makeDefault(a.id)} className="text-label text-primary hover:underline">
                    Predeterminar
                  </button>
                )}
                <button type="button" onClick={() => unlink(a.id)} className="text-label text-negative hover:underline">
                  Desvincular
                </button>
              </span>
            </div>
          </li>
        ))}
        {accounts.length === 0 && <li className="text-xs text-fg-subtle">No tenés cuentas vinculadas.</li>}
      </ul>
    </div>
  );
}

export { MoneyActionButton };
