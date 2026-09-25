"use client";

import { Badge } from "@/components/ui/Badge";
import { Stat } from "@/components/ui/Page";
import { adminKpis as k, clients as seedClients } from "@/lib/admin-data";
import { formatDecimal, formatInteger } from "@/lib/format";
import { dollarRates } from "@/lib/mock-data";
import { orderValue } from "@/lib/orders";
import { useClientsStore, useOrdersStore } from "@/lib/store/hooks";

const MEP = dollarRates.find((r) => r.label === "MEP")?.price ?? 1_285.4;
const seedActive = seedClients.filter((c) => c.status === "activo").length;

/**
 * KPIs de la consola: parten de los valores del broker (Figma) y suman lo que pasa en la demo:
 * comitentes aprobados/bloqueados, altas manuales y operaciones reales del inversor.
 */
export function AdminKpis() {
  const [clients] = useClientsStore();
  const [orders] = useOrdersStore();

  const active = k.activeClients + clients.filter((c) => c.status === "activo").length - seedActive;
  const newToday = Math.max(0, clients.length - seedClients.length);
  const investorVolume = orders
    .filter((o) => !o.simulated)
    .reduce((a, o) => {
      const qty = o.filled - (o.settledQty ?? 0);
      if (qty <= 0) return a;
      const gross = orderValue(o.symbol, qty, o.price, o.side).gross;
      return a + (o.currency === "USD" ? gross * MEP : gross);
    }, 0);
  const volume = k.volumeToday + investorVolume;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Stat label="Comitentes activos" value={formatInteger(active)} badge={<Badge tone="positive">+{formatDecimal(k.activeClientsChangePct)}%</Badge>} hint={`${formatInteger(k.connectedNow)} conectados en rueda`} />
      <Stat
        label="Nuevas cuentas (mes)"
        value={formatInteger(k.newAccountsMonth + newToday)}
        badge={<Badge tone="primary">SLA 98%</Badge>}
        hint={`+${k.newAccountsToday + newToday} hoy · 85% aprobación automática`}
      />
      <Stat
        label="Volumen operado hoy"
        value={<span className="text-lg">${formatInteger(volume)}</span>}
        badge={<Badge tone="positive">+{Math.round(((volume / (k.volumeToday / (1 + k.volumeVsYesterdayPct / 100))) - 1) * 100)}% vs ayer</Badge>}
        hint={investorVolume ? `Incluye $${formatInteger(investorVolume)} operados en la demo` : "BYMA acciones & CEDEARs 61,2%"}
      />
      <Stat label="Fondos bajo custodia" value={`$${formatInteger(k.aucM)}M`} badge={<Badge>AUC</Badge>} hint={`+$${formatInteger(k.aucTodayM)}M hoy · Caja de Valores`} />
    </div>
  );
}
