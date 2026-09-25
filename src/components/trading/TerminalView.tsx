"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { InstrumentHeader } from "./InstrumentHeader";
import { OrderBook } from "./OrderBook";
import { OrderTicket } from "./OrderTicket";
import { OpenOrders } from "./OpenOrders";
import { PriceChart } from "./PriceChart";
import { useTrading } from "./TradingProvider";
import { useTicketLevels } from "./useTicketLevels";
import { Panel, table } from "@/components/ui/Page";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { instruments } from "@/lib/market-data";
import { formatDecimal, formatInteger, formatPercent } from "@/lib/format";
import { FeedControls } from "@/components/market/FeedControls";
import { useMarket } from "@/components/market/MarketProvider";
import { TimeAndSales } from "./TimeAndSales";
import { isOpenOrder } from "@/lib/trading";
import { priceDivisor } from "@/lib/orders";
import { useSettingsStore } from "@/lib/store/hooks";

type BottomTab = "orders" | "positions" | "history";

/** Terminal avanzada: gráfico grande con RSI, libro L2 y boleta lateral. */
export function TerminalView({ symbol }: { symbol: string }) {
  const router = useRouter();
  const { quote, prices } = useMarket();
  const instrument = quote(symbol);
  const { orders, submit, cancel, cancelBracket, available, sellable, simMode, account } = useTrading();
  const [settings] = useSettingsStore();
  const [levels, setLevels] = useTicketLevels(instrument);
  const positions = Object.entries(account.positions).map(([sym, p]) => {
    const last = prices[sym] ?? p.avgPrice;
    return { symbol: sym, qty: p.qty, avgPrice: p.avgPrice, last, pnl: ((last - p.avgPrice) * p.qty) / priceDivisor(sym), pct: (last / p.avgPrice - 1) * 100 };
  });
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
        <span className="ml-auto">
          <FeedControls />
        </span>
      </div>

      <InstrumentHeader instrument={instrument} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Panel title="Gráfico avanzado" subtitle="Velas, volumen, EMA 20/50 y RSI 14" className="min-w-0">
          <PriceChart instrument={instrument} withRsi height="h-[420px]" levels={levels} onLevelsChange={setLevels} />
        </Panel>
        <div className="flex flex-col gap-4">
          <Panel title="Libro de órdenes" actions={<Badge>Profundidad L2</Badge>}>
            <OrderBook
              symbol={instrument.symbol}
              price={instrument.price}
              levels={6}
              compact
              onPriceClick={(price) => setLevels({ ...levels, price, type: levels.type === "Mercado" ? "Límite" : levels.type })}
            />
          </Panel>
          <Panel title="Caudal en vivo">
            <TimeAndSales symbol={instrument.symbol} rows={5} />
          </Panel>
          <Panel title="Boleta rápida">
            <OrderTicket
              key={`${instrument.symbol}-${simMode}`}
              instrument={instrument}
              onSubmit={submit}
              available={available(instrument.currency)}
              sellable={sellable(instrument.symbol)}
              confirmByDefault={settings.confirmOrders}
              simulated={simMode}
              levels={levels}
              onLevelsChange={setLevels}
            />
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
              { id: "orders", label: "Órdenes abiertas", count: orders.filter(isOpenOrder).length },
              { id: "positions", label: "Posiciones en cartera", count: positions.length },
              { id: "history", label: "Historial de ejecuciones", count: orders.filter((o) => o.status === "executed").length },
            ]}
          />
          {tab === "orders" && <OpenOrders orders={orders.filter((o) => isOpenOrder(o) || o.bracketState === "active")} onCancel={cancel} onCancelBracket={cancelBracket} />}
          {tab === "history" && <OpenOrders orders={orders.filter((o) => o.status === "executed" || o.status === "cancelled")} />}
          {tab === "positions" && (
            <div className={table.wrap}>
              <table className={`${table.table} min-w-[600px]`}>
                <thead>
                  <tr>
                    {["Especie", "Cantidad", "PPC", "Último", "Resultado", ""].map((h) => (
                      <th key={h} className={table.th}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {positions.map((h) => (
                    <tr key={h.symbol} className={table.row}>
                      <td className={`${table.td} font-mono font-semibold`}>{h.symbol}</td>
                      <td className={`${table.td} font-mono`}>{formatInteger(h.qty)}</td>
                      <td className={`${table.td} font-mono`}>{formatDecimal(h.avgPrice)}</td>
                      <td className={`${table.td} font-mono`}>{formatDecimal(h.last)}</td>
                      <td className={`${table.td} font-mono ${h.pnl >= 0 ? "text-positive" : "text-negative"}`}>
                        {h.pnl >= 0 ? "+" : "-"}
                        {formatDecimal(Math.abs(h.pnl))} ({formatPercent(h.pct)})
                      </td>
                      <td className={`${table.td} text-right`}>
                        <button type="button" onClick={() => router.push(`/terminal/${h.symbol}`)} className="text-label text-primary hover:underline">
                          Abrir
                        </button>
                      </td>
                    </tr>
                  ))}
                  {positions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-xs text-fg-subtle">
                        Sin posiciones {simMode ? "simuladas" : ""}. Comprá algo desde la boleta.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}
