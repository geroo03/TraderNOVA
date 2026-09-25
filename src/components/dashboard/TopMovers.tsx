"use client";

import Link from "next/link";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { Change } from "@/components/ui/Amount";
import { flashClass, useMarket } from "@/components/market/MarketProvider";
import { usePortfolio } from "@/components/portfolio/usePortfolio";
import { formatDecimal } from "@/lib/format";
import type { Instrument } from "@/lib/market-data";

type Scope = "portfolio" | "market";

function tagOf(i: Instrument): { tag: string; tone: "positive" | "muted" } {
  if (i.board === "CEDEAR") return { tag: `CEDEAR ${i.ratio ?? ""}`.trim(), tone: "muted" };
  if (i.board === "Bono") return { tag: "BONO USD", tone: "muted" };
  return { tag: i.volumeM > 2_000 ? "BYMA LÍDER" : "BYMA", tone: i.volumeM > 2_000 ? "positive" : "muted" };
}

/** Mayores variaciones en vivo: de tu cartera o de todo el mercado. */
export function TopMovers() {
  const [scope, setScope] = useState<Scope>("portfolio");
  const { quotes, moves } = useMarket();
  const { holdings } = usePortfolio();
  const owned = new Set(holdings.map((h) => h.symbol));
  const universe = scope === "portfolio" ? quotes.filter((q) => owned.has(q.symbol)) : quotes;
  const list = [...universe].sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct)).slice(0, 5);

  return (
    <Card className="flex h-full flex-col p-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-1 whitespace-nowrap text-base font-bold">
          <Icon name="icon-bolt" width={14} height={17} />
          Mayores Variaciones
        </h2>
        <div role="group" aria-label="Alcance" className="flex gap-0.5">
          {(
            [
              ["portfolio", "Tu Cartera"],
              ["market", "Mercado"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={scope === id}
              onClick={() => setScope(id)}
              className={`text-label rounded px-2 py-0.5 ${scope === id ? "bg-surface-higher text-fg" : "text-fg-subtle"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-fg-subtle">Precios y variaciones intradía en tiempo real</p>

      <ul className="flex flex-col gap-1.5 pt-2.5">
        {list.map((m) => {
          const up = m.changePct >= 0;
          const t = tagOf(m);
          return (
            <li key={m.symbol} className="flex items-center justify-between rounded-lg bg-surface-high p-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className={`flex size-8 shrink-0 items-center justify-center rounded bg-surface-lowest font-mono text-xs font-semibold ${up ? (m.board === "CEDEAR" ? "text-primary" : "text-positive") : "text-negative"}`}>
                  {m.symbol.slice(0, 2)}
                </span>
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5">
                    <span className="font-mono text-sm font-semibold">{m.symbol}</span>
                    <Badge tone={t.tone} className="py-0">
                      {t.tag}
                    </Badge>
                  </p>
                  <p className="truncate text-xs text-fg-subtle">{m.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div key={m.price} className={`rounded px-1 text-right font-mono ${flashClass(moves[m.symbol])}`}>
                  <p className="text-sm font-semibold">
                    {m.currency === "USD" ? "U$S " : "$"}
                    {formatDecimal(m.price)}
                  </p>
                  <Change value={m.changePct} className="text-xs font-medium" />
                </div>
                <Link
                  href={`/operar?especie=${encodeURIComponent(m.symbol)}`}
                  className={`text-label rounded px-2 py-1 ${up ? "bg-positive/15 text-positive" : "bg-negative/15 text-negative"}`}
                >
                  OPERAR
                </Link>
              </div>
            </li>
          );
        })}
        {list.length === 0 && <li className="p-4 text-center text-xs text-fg-subtle">Todavía no tenés posiciones.</li>}
      </ul>

      <div className="mt-auto flex items-center justify-between pt-3">
        <span className="text-label text-fg-subtle">
          {scope === "portfolio" ? `${list.length} de ${holdings.length} activos en cartera` : `Top 5 de ${quotes.length} especies`}
        </span>
        <Link href="/cotizaciones" className="flex items-center gap-1 text-xs text-primary hover:underline">
          Ver todas las cotizaciones
          <Icon name="icon-arrow-right-sm" width={10} height={10} />
        </Link>
      </div>
    </Card>
  );
}
