"use client";

import Link from "next/link";
import { Badge, StatusDot, type Tone } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { formatDecimal, formatInteger } from "@/lib/format";
import { currentUser } from "@/lib/mock-data";
import { orderValue } from "@/lib/orders";
import { findInstrument } from "@/lib/market-data";
import type { Currency } from "@/lib/types";
import { useTrading } from "@/components/trading/TradingProvider";
import type { LiveOrder } from "@/lib/trading";

function money(value: number, currency: Currency): string {
  return `${currency === "USD" ? "U$S " : "$"}${formatDecimal(value)}`;
}

function statusView(o: LiveOrder): { label: string; tone: Tone } {
  switch (o.status) {
    case "executed":
      return { label: "Ejecutada", tone: "positive" };
    case "partial":
      return { label: `Parcial ${Math.round((o.filled / o.quantity) * 100)}%`, tone: "primary" };
    case "working":
      return { label: "En Rueda", tone: "neutral" };
    case "cancelled":
      return { label: "Cancelada", tone: "negative" };
  }
}

const KIND = { "Panel Líder": "Acción", CEDEAR: "CEDEAR", Bono: "Bono USD" } as const;

const TH = "text-label px-3 py-2.5 uppercase text-fg-subtle whitespace-nowrap";

export function RecentOrders() {
  const { orders } = useTrading();
  const recent = orders.slice(0, 5);
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon name="icon-receipt" width={17} height={19} />
          <div>
            <h2 className="text-lg font-bold tracking-[-0.18px]">Órdenes Recientes en Rueda</h2>
            <p className="text-xs text-fg-subtle">Operaciones enviadas al Sistema Integrado de Negociación BYMA hoy</p>
          </div>
        </div>
        <Link href="/ordenes" className="flex items-center gap-1 text-xs text-primary hover:underline">
          Ver historial completo de boletas
          <Icon name="icon-arrow-right-link" width={11} height={11} />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-separate border-spacing-0">
          <thead>
            <tr className="bg-surface-high">
              <th scope="col" className={`${TH} rounded-l-lg text-left`}>Especie</th>
              <th scope="col" className={`${TH} text-left`}>Tipo &amp; Plazo</th>
              <th scope="col" className={`${TH} text-right`}>Cantidad nom.</th>
              <th scope="col" className={`${TH} text-right`}>Precio límite</th>
              <th scope="col" className={`${TH} text-right`}>Monto estimado</th>
              <th scope="col" className={`${TH} text-center`}>Hora</th>
              <th scope="col" className={`${TH} rounded-r-lg text-center`}>Estado rueda</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((order, i) => {
              const status = statusView(order);
              const kind = KIND[findInstrument(order.symbol)?.board ?? "Panel Líder"];
              return (
                <tr key={order.id} className={i % 2 === 1 ? "bg-surface-high/20" : undefined}>
                  <td className="px-3 py-2.5">
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold">{order.symbol}</span>
                      <Badge className="text-fg-subtle">{kind}</Badge>
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="flex items-center gap-1.5">
                      <Badge tone={order.side === "buy" ? "positive" : "negative"}>{order.side === "buy" ? "COMPRA" : "VENTA"}</Badge>
                      <span className="text-xs text-fg-subtle">
                        {order.type} · {order.term}
                      </span>
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono text-xs font-medium">{formatInteger(order.quantity)}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-xs font-medium">{money(order.price, order.currency)}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-xs font-semibold">{money(orderValue(order.symbol, order.quantity, order.price, order.side).gross, order.currency)}</td>
                  <td className="px-3 py-2.5 text-center font-mono text-xs text-fg-subtle">{order.time}</td>
                  <td className="px-3 py-2 text-center">
                    <Badge tone={status.tone} pill className={`px-2 ${status.tone === "neutral" ? "bg-surface-highest" : ""}`}>
                      <StatusDot tone={status.tone} />
                      {status.label}
                    </Badge>
                  </td>
                </tr>
              );
            })}
            {recent.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-xs text-fg-subtle">
                  Sin órdenes todavía. <Link href="/operar" className="text-primary hover:underline">Hacé tu primera operación</Link>.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <p className="text-label flex items-center gap-1.5 text-fg-subtle">
          <Icon name="icon-lock-small" width={10} height={13} />
          Operaciones custodiadas en Caja de Valores S.A. a nombre del comitente {currentUser.accountNumber}.
        </p>
        <p className="text-label text-fg-subtle/70">
          Prototipo NODO Trading Terminal · Datos de mercado de ejemplo sin validez impositiva.
        </p>
      </div>
    </Card>
  );
}
