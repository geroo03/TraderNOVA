"use client";

import { useMemo, useState } from "react";
import { Badge, StatusDot, type Tone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MsIcon } from "@/components/ui/MsIcon";
import { Panel, Stat, table } from "@/components/ui/Page";
import { Tabs } from "@/components/ui/Tabs";
import { useToast } from "@/components/ui/Toast";
import { deskOrders, type AdminOrder, type AdminOrderStatus } from "@/lib/admin-data";
import { downloadFile, stamp, toCsv } from "@/lib/download";
import { formatDecimal, formatInteger } from "@/lib/format";
import { currentUser, staffUser } from "@/lib/mock-data";
import { orderValue } from "@/lib/orders";
import { useLocalStore } from "@/lib/store/local-store";
import { pushAudit, pushNotification, useOrdersStore } from "@/lib/store/hooks";

const statusView: Record<AdminOrderStatus, { label: string; tone: Tone }> = {
  working: { label: "En rueda", tone: "primary" },
  partial: { label: "Parcial", tone: "primary" },
  executed: { label: "Ejecutada", tone: "positive" },
  cancelled: { label: "Cancelada", tone: "neutral" },
  rejected: { label: "Rechazada", tone: "negative" },
};

type Filter = "all" | "open" | "executed" | "rejected";
const NO_OVERRIDES: Record<string, AdminOrderStatus> = {};

/** Libro de órdenes de todos los comitentes. Incluye en vivo las órdenes reales del inversor de la demo. */
export function AdminOrdersView() {
  const toast = useToast();
  const [investorOrders, setInvestorOrders] = useOrdersStore();
  const [overrides, setOverrides] = useLocalStore(`admin-order-status`, NO_OVERRIDES);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const all = useMemo<AdminOrder[]>(() => {
    const mine: AdminOrder[] = investorOrders
      .filter((o) => !o.simulated)
      .map((o) => ({ ...o, client: currentUser.fullName, account: currentUser.accountNumber, channel: "Web" as const, status: o.status }));
    const others = deskOrders.map((o) => ({ ...o, status: overrides[o.id] ?? o.status }));
    return [...mine, ...others].sort((a, b) => b.time.localeCompare(a.time));
  }, [investorOrders, overrides]);

  const q = query.trim().toLowerCase();
  const isOpen = (o: AdminOrder) => o.status === "working" || o.status === "partial";
  const rows = all
    .filter((o) => (filter === "all" ? true : filter === "open" ? isOpen(o) : o.status === filter))
    .filter((o) => !q || `${o.id} ${o.client} ${o.account} ${o.symbol}`.toLowerCase().includes(q));
  const volume = all.filter((o) => o.filled > 0 && o.currency === "ARS").reduce((a, o) => a + orderValue(o.symbol, o.filled, o.price, o.side).gross, 0);

  function forceCancel(o: AdminOrder) {
    if (!window.confirm(`¿Cancelar la orden ${o.id} de ${o.client}? Se notifica al comitente.`)) return;
    if (o.account === currentUser.accountNumber) {
      setInvestorOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, status: "cancelled" } : x)));
      pushNotification({ title: "Orden cancelada por la mesa", text: `${o.id}: ${o.symbol}. Consultá con soporte si tenés dudas.`, tone: "negative", href: "/ordenes" });
    } else {
      setOverrides((prev) => ({ ...prev, [o.id]: "cancelled" }));
    }
    pushAudit({ who: staffUser.fullName, role: "Mesa de operaciones", action: "Cancelación forzada de orden", ref: o.id, detail: `${o.client} · ${o.symbol} ${formatInteger(o.quantity)}` });
    toast({ title: "Orden cancelada", text: `${o.id} · ${o.client}`, tone: "neutral" });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Órdenes hoy" value={formatInteger(all.length)} hint="Muestra de la rueda (demo)" />
        <Stat label="Abiertas en rueda" value={formatInteger(all.filter(isOpen).length)} badge={<Badge tone="primary">Live</Badge>} />
        <Stat label="Rechazadas" value={<span className="text-negative">{all.filter((o) => o.status === "rejected").length}</span>} badge={<Badge tone="negative">Auditar</Badge>} hint="Margen, KYC, banda de precios" />
        <Stat label="Volumen ejecutado ARS" value={<span className="text-lg">${formatInteger(volume)}</span>} />
      </div>
      <Panel
        title="Libro de órdenes de comitentes"
        subtitle="Las órdenes del inversor de la demo aparecen acá en cuanto las carga"
        actions={
          <>
            <label className="flex items-center gap-2 rounded-lg bg-surface-high px-3 py-1.5">
              <MsIcon name="search" size={16} className="text-fg-subtle" />
              <span className="sr-only">Buscar orden</span>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ID, comitente, especie…" className="w-44 bg-transparent text-xs outline-none" />
            </label>
            <Button
              size="sm"
              variant="secondary"
              icon="download"
              onClick={() =>
                downloadFile(
                  `libro-ordenes_${stamp()}.csv`,
                  toCsv(["id", "hora", "comitente", "cuenta", "canal", "especie", "operacion", "tipo", "cantidad", "ejecutada", "precio", "moneda", "estado", "motivo"], rows.map((o) => [o.id, o.time, o.client, o.account, o.channel, o.symbol, o.side, o.type, o.quantity, o.filled, o.price, o.currency, o.status, o.reason])),
                )
              }
            >
              CSV
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <Tabs
            label="Estado"
            value={filter}
            onChange={setFilter}
            items={[
              { id: "all", label: "Todas", count: all.length },
              { id: "open", label: "Abiertas", count: all.filter(isOpen).length },
              { id: "executed", label: "Ejecutadas", count: all.filter((o) => o.status === "executed").length },
              { id: "rejected", label: "Rechazadas", count: all.filter((o) => o.status === "rejected").length },
            ]}
          />
          <div className={table.wrap}>
            <table className={`${table.table} min-w-[980px]`}>
              <thead>
                <tr>
                  {["Orden · hora", "Comitente", "Canal", "Especie", "Operación", "Cant. / ejec.", "Precio", "Estado", ""].map((h) => (
                    <th key={h} className={table.th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => {
                  const s = statusView[o.status];
                  return (
                    <tr key={o.id} className={`${table.row} ${o.account === currentUser.accountNumber ? "bg-primary-strong/5" : ""}`}>
                      <td className={table.td}>
                        <span className="block font-mono font-semibold">{o.id}</span>
                        <span className="font-mono text-[10px] text-fg-subtle">{o.time}</span>
                      </td>
                      <td className={table.td}>
                        <span className="block font-semibold">{o.client}</span>
                        <span className="font-mono text-[10px] text-fg-subtle">Cta. {o.account}</span>
                      </td>
                      <td className={`${table.td} text-fg-subtle`}>{o.channel}</td>
                      <td className={`${table.td} font-mono font-semibold`}>{o.symbol}</td>
                      <td className={table.td}>
                        <Badge tone={o.side === "buy" ? "positive" : "negative"}>{o.side === "buy" ? "COMPRA" : "VENTA"}</Badge>
                        <span className="block pt-0.5 text-[10px] text-fg-subtle">{o.type}</span>
                      </td>
                      <td className={`${table.td} font-mono`}>
                        {formatInteger(o.quantity)} / {formatInteger(o.filled)}
                      </td>
                      <td className={`${table.td} font-mono`}>
                        {o.currency === "USD" ? "U$S " : "$"}
                        {formatDecimal(o.price)}
                      </td>
                      <td className={table.td}>
                        <Badge tone={s.tone} pill>
                          <StatusDot tone={s.tone} /> {s.label}
                        </Badge>
                        {o.reason && <span className="block pt-0.5 text-[10px] text-negative">{o.reason}</span>}
                      </td>
                      <td className={`${table.td} text-right`}>
                        {isOpen(o) && (
                          <Button size="sm" variant="danger" icon="block" onClick={() => forceCancel(o)}>
                            Cancelar
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-6 text-center text-xs text-fg-subtle">
                      Sin órdenes para este filtro.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Panel>
    </div>
  );
}
