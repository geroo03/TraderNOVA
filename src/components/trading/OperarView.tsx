"use client";

import { useState } from "react";
import { InstrumentHeader } from "./InstrumentHeader";
import { OrderBook } from "./OrderBook";
import { OrderTicket } from "./OrderTicket";
import { OpenOrders } from "./OpenOrders";
import { PriceChart } from "./PriceChart";
import { TimeAndSales } from "./TimeAndSales";
import { useTrading } from "./TradingProvider";
import { useTicketLevels } from "./useTicketLevels";
import { FeedControls } from "@/components/market/FeedControls";
import { useMarket } from "@/components/market/MarketProvider";
import { Panel } from "@/components/ui/Page";
import { Badge, StatusDot } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { instruments } from "@/lib/market-data";
import type { Side } from "@/lib/order-costs";
import { isOpenOrder } from "@/lib/trading";
import { useSettingsStore } from "@/lib/store/hooks";

export function OperarView({ symbol, side }: { symbol: string; side: Side }) {
  const [current, setCurrent] = useState(symbol);
  const { quote, session, live } = useMarket();
  const instrument = quote(current);
  const { orders, submit, cancel, cancelAll, cancelBracket, available, sellable, simMode, restriction } = useTrading();
  const [settings] = useSettingsStore();
  const [levels, setLevels] = useTicketLevels(instrument);
  const openCount = orders.filter(isOpenOrder).length;
  const pickPrice = (price: number) => setLevels({ ...levels, price, type: levels.type === "Mercado" ? "Límite" : levels.type });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="flex min-w-0 flex-1 items-center gap-2 text-xs text-fg-subtle">
          Especie
          <select
            value={instrument.symbol}
            onChange={(e) => setCurrent(e.target.value)}
            className="w-full min-w-0 max-w-sm rounded-lg bg-surface px-3 py-1.5 font-mono text-sm font-semibold text-fg"
          >
            {instruments.map((i) => (
              <option key={i.symbol} value={i.symbol}>
                {i.symbol} · {i.name}
              </option>
            ))}
          </select>
        </label>
        <FeedControls />
        <ButtonLink href={`/terminal/${instrument.symbol}`} variant="secondary" icon="open_in_full">
          Abrir terminal avanzada
        </ButtonLink>
      </div>

      <InstrumentHeader instrument={instrument} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[320px_minmax(0,1fr)_280px]">
        <Panel title="Boleta de operación" className="xl:row-span-2">
          <OrderTicket
            key={`${instrument.symbol}-${simMode}`}
            instrument={instrument}
            initialSide={side}
            onSubmit={submit}
            available={available(instrument.currency)}
            sellable={sellable(instrument.symbol)}
            confirmByDefault={settings.confirmOrders}
            restriction={restriction}
            marketOpen={session.open}
            sessionLabel={session.label}
            simulated={simMode}
            levels={levels}
            onLevelsChange={setLevels}
          />
        </Panel>
        <Panel title="Gráfico" subtitle="Velas con EMA 20 / 50" className="min-w-0">
          <PriceChart instrument={instrument} levels={levels} onLevelsChange={setLevels} />
        </Panel>
        <div className="flex flex-col gap-4">
          <Panel title="Libro de ofertas" actions={<Badge>Nivel 2</Badge>}>
            <OrderBook symbol={instrument.symbol} price={instrument.price} onPriceClick={pickPrice} />
          </Panel>
          <Panel
            title="Caudal en vivo"
            actions={
              <Badge tone={live ? "positive" : "neutral"}>
                <StatusDot tone={live ? "positive" : "neutral"} /> {live ? "Feed online" : "Sin operaciones"}
              </Badge>
            }
          >
            <TimeAndSales symbol={instrument.symbol} />
          </Panel>
        </div>
      </div>

      <Panel
        title={
          <>
            Órdenes {simMode ? "simuladas" : "de la rueda"} <Badge tone="primary">{openCount} activas</Badge>
          </>
        }
        actions={
          <>
            <ButtonLink href="/ordenes" variant="ghost" size="sm">
              Historial completo
            </ButtonLink>
            <Button variant="danger" size="sm" onClick={cancelAll} disabled={openCount === 0}>
              Cancelar todas
            </Button>
          </>
        }
      >
        <OpenOrders orders={orders} onCancel={cancel} onCancelBracket={cancelBracket} />
        <p className="text-label pt-2 text-fg-subtle">
          {simMode ? "Modo simulación: saldo virtual, sin riesgo." : "Demo: las órdenes no llegan al mercado."} Las órdenes límite se ejecutan cuando el precio simulado las alcanza.
        </p>
      </Panel>
    </div>
  );
}
