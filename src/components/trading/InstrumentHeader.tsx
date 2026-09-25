"use client";

import { Badge, StatusDot } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { formatDecimal, formatPercent } from "@/lib/format";
import type { Instrument } from "@/lib/market-data";
import type { ReactNode } from "react";
import { flashClass, useMarket } from "@/components/market/MarketProvider";

function money(i: Instrument, v: number) {
  return `${i.currency === "USD" ? "U$S " : "$"}${formatDecimal(v)}`;
}

/** Encabezado de especie con precio, variación y estadísticas de la rueda. */
export function InstrumentHeader({ instrument, actions }: { instrument: Instrument; actions?: ReactNode }) {
  const i = instrument;
  const prev = i.price / (1 + i.changePct / 100);
  const stats = [
    ["Apertura", money(i, prev * 1.002)],
    ["Máximo", money(i, i.price * 1.008)],
    ["Mínimo", money(i, prev * 0.994)],
    ["Cierre ant.", money(i, prev)],
    ["Volumen", `$${formatDecimal(i.volumeM)}M`],
  ];
  const up = i.changePct >= 0;
  const { moves } = useMarket();

  return (
    <Card className="flex flex-wrap items-center justify-between gap-4 p-4">
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-surface-higher font-mono text-sm font-bold text-primary">
            {i.symbol[0]}
          </span>
          <span className="font-mono text-xl font-bold">{i.symbol}</span>
          <span className="truncate text-sm text-fg-muted">{i.name}</span>
          <Badge tone="positive" className="uppercase">
            {i.board === "Panel Líder" ? "Líder BYMA" : i.board}
          </Badge>
          {i.ratio && <Badge>{i.ratio}</Badge>}
        </div>
        <p className="text-label flex items-center gap-1 uppercase text-fg-subtle">
          <StatusDot /> Mercado abierto · Cierre 17:00 hs (ART) · Prev. ${formatDecimal(prev)}
        </p>
        <dl className="flex flex-wrap gap-x-5 gap-y-1">
          {stats.map(([k, v]) => (
            <div key={k}>
              <dt className="text-label uppercase text-fg-subtle">{k}</dt>
              <dd className="font-mono text-xs font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="flex flex-col items-end gap-2">
        <p key={i.price} className={`rounded px-1 font-mono text-3xl font-bold tracking-[-1px] ${flashClass(moves[i.symbol])}`}>
          {money(i, i.price)}
        </p>
        <p className={`font-mono text-sm font-semibold ${up ? "text-positive" : "text-negative"}`}>
          {formatPercent(i.changePct)} ({up ? "+" : "-"}
          {money(i, Math.abs(i.price - prev))})
        </p>
        {actions}
      </div>
    </Card>
  );
}
