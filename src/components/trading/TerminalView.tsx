"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { InstrumentHeader } from "./InstrumentHeader";
import { OrderBook } from "./OrderBook";
import { OrderTicket } from "./OrderTicket";
import { OpenOrders } from "./OpenOrders";
import { PriceChart } from "./PriceChart";
import { useOrders } from "./useOrders";
import { Panel, table } from "@/components/ui/Page";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { findInstrument, instruments } from "@/lib/market-data";
import { holdings } from "@/lib/portfolio";
import { formatDecimal, formatInteger, formatPercent } from "@/lib/format";

type BottomTab = "orders" | "positions" | "history";

/** Terminal avanzada: gráfico grande con RSI, libro L2 y boleta lateral. */
export function TerminalView({ symbol }: { symbol: string }) {
  const router = useRouter();
  const instrument = findInstrument(symbol) ?? instruments[0];
  const { orders, add, cancel } = useOrders();
  const [tab, setTab] = useState<BottomTab>("orders");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="terminal-symbol">
          Cambiar especie
        </label>
        <select
          id="terminal-symbol"
          value={instrument.symbol}
          onChange={(e) => router.push(`/terminal/${e.target.value}`)}
          className="rounded-lg bg-surface px-3 py-1.5 font-mono text-sm font-semibold"
        >
          {instruments.map((i) => (
            <option key={i.symbol}>{i.symbol}</option>
          ))}
        </select>
        <Badge tone="positive">DMA FIX 4.4 conectado</Badge>
        <Badge>Latencia 4 ms</Badge>
      </div>

      <InstrumentHeader instrument={instrument} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Panel title="Gráfico avanzado" subtitle="Velas, volumen, EMA 20/50 y RSI 14" className="min-w-0">
          <PriceChart instrument={instrument} withRsi height="h-[420px]" />
        </Panel>
        <div className="flex flex-col gap-4">
          <Panel title="Libro de órdenes" actions={<Badge>Profundidad L2</Badge>}>
            <OrderBook symbol={instrument.symbol} price={instrument.price} levels={6} compact />
          </Panel>
          <Panel title="Boleta rápida">
            <OrderTicket key={instrument.symbol} instrument={instrument} onSubmit={add} />
          </Panel>
        </div>
      </div>

      <Panel>
        <div className="flex flex-col gap-3">
          <Tabs
            label="Actividad"
            value={tab}
            onChange={setTab}
            items={[
              { id: "orders", label: "Órdenes abiertas", count: orders.filter((o) => o.status === "working" || o.status === "partial").length },
              { id: "positions", label: "Posiciones en cartera", count: holdings.length },
              { id: "history", label: "Historial de ejecuciones", count: orders.filter((o) => o.status === "executed").length },
            ]}
          />
          {tab === "orders" && <OpenOrders orders={orders.filter((o) => o.status === "working" || o.status === "partial")} onCancel={cancel} />}
          {tab === "history" && <OpenOrders orders={orders.filter((o) => o.status === "executed" || o.status === "cancelled")} />}
          {tab === "positions" && (
            <div className={table.wrap}>
              <table className={`${table.table} min-w-[600px]`}>
                <thead>
                  <tr>
                    {["Especie", "Cantidad", "PPC", "Último", "Resultado"].map((h) => (
                      <th key={h} className={table.th}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((h) => (
                    <tr key={h.symbol} className={table.row}>
                      <td className={`${table.td} font-mono font-semibold`}>{h.symbol}</td>
                      <td className={`${table.td} font-mono`}>{formatInteger(h.quantity)}</td>
                      <td className={`${table.td} font-mono`}>${formatDecimal(h.avgPrice)}</td>
                      <td className={`${table.td} font-mono`}>${formatDecimal(h.lastPrice)}</td>
                      <td className={`${table.td} font-mono ${h.gainPct >= 0 ? "text-positive" : "text-negative"}`}>{formatPercent(h.gainPct)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}
