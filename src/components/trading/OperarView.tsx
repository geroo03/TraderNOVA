"use client";

import { useState } from "react";
import { InstrumentHeader } from "./InstrumentHeader";
import { OrderBook } from "./OrderBook";
import { OrderTicket } from "./OrderTicket";
import { OpenOrders } from "./OpenOrders";
import { PriceChart } from "./PriceChart";
import { TimeAndSales } from "./TimeAndSales";
import { useOrders } from "./useOrders";
import { Panel } from "@/components/ui/Page";
import { Badge, StatusDot } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { findInstrument, instruments } from "@/lib/market-data";
import type { Side } from "@/lib/order-costs";

export function OperarView({ symbol, side }: { symbol: string; side: Side }) {
  const [current, setCurrent] = useState(symbol);
  const instrument = findInstrument(current) ?? instruments[0];
  const { orders, add, cancel, cancelAll } = useOrders();
  const openCount = orders.filter((o) => o.status === "working" || o.status === "partial").length;

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
        <ButtonLink href={`/terminal/${instrument.symbol}`} variant="secondary" icon="open_in_full">
          Abrir terminal avanzada
        </ButtonLink>
      </div>

      <InstrumentHeader instrument={instrument} />

      <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)_280px]">
        <Panel title="Boleta de operación" className="xl:row-span-2">
          <OrderTicket key={instrument.symbol} instrument={instrument} initialSide={side} onSubmit={add} />
        </Panel>
        <Panel title="Gráfico" subtitle="Velas con EMA 20 / 50" className="min-w-0">
          <PriceChart instrument={instrument} />
        </Panel>
        <div className="flex flex-col gap-4">
          <Panel title="Libro de ofertas" actions={<Badge>Nivel 2</Badge>}>
            <OrderBook symbol={instrument.symbol} price={instrument.price} />
          </Panel>
          <Panel title="Caudal en vivo" actions={<Badge tone="positive"><StatusDot /> Feed online</Badge>}>
            <TimeAndSales />
          </Panel>
        </div>
      </div>

      <Panel
        title={
          <>
            Órdenes de la rueda <Badge tone="primary">{openCount} activas</Badge>
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
        <OpenOrders orders={orders} onCancel={cancel} />
        <p className="text-label pt-2 text-fg-subtle">Prototipo: las órdenes no se envían al mercado y se pierden al recargar.</p>
      </Panel>
    </div>
  );
}
