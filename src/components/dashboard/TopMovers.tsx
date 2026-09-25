"use client";

import Link from "next/link";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { Change } from "@/components/ui/Amount";
import { formatDecimal } from "@/lib/format";
import { portfolioAssetCount, topMovers } from "@/lib/mock-data";
import type { Mover } from "@/lib/types";

type Scope = "portfolio" | "market";

function initialsColor(m: Mover): string {
  if (m.changePct < 0) return "text-negative";
  return m.tag.startsWith("CEDEAR") ? "text-primary" : "text-positive";
}

export function TopMovers() {
  // TODO: la pestaña "Mercado" necesita su propio endpoint; hoy muestra la misma lista.
  const [scope, setScope] = useState<Scope>("portfolio");

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
        {topMovers.map((m) => {
          const up = m.changePct >= 0;
          return (
            <li key={m.symbol} className="flex items-center justify-between rounded-lg bg-surface-high p-2">
              <div className="flex items-center gap-2">
                <span className={`flex size-8 items-center justify-center rounded bg-surface-lowest font-mono text-xs font-semibold ${initialsColor(m)}`}>
                  {m.initials}
                </span>
                <div>
                  <p className="flex items-center gap-1.5">
                    <span className="font-mono text-sm font-semibold">{m.symbol}</span>
                    <Badge tone={m.tagTone === "positive" ? "positive" : "muted"} className="py-0">
                      {m.tag}
                    </Badge>
                  </p>
                  <p className="text-xs text-fg-subtle">{m.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right font-mono">
                  <p className="text-sm font-semibold">${formatDecimal(m.price)}</p>
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
      </ul>

      <div className="mt-auto flex items-center justify-between pt-3">
        <span className="text-label text-fg-subtle">
          {topMovers.length} de {portfolioAssetCount} activos en cartera
        </span>
        <Link href="/cotizaciones" className="flex items-center gap-1 text-xs text-primary hover:underline">
          Ver todas las cotizaciones
          <Icon name="icon-arrow-right-sm" width={10} height={10} />
        </Link>
      </div>
    </Card>
  );
}
