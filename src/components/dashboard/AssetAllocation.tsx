"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { Donut } from "@/components/charts/Donut";
import { usePortfolio } from "@/components/portfolio/usePortfolio";
import { formatInteger } from "@/lib/format";

const PCT_COLORS = ["text-primary", "text-positive", "text-primary", "text-negative"] as const;

/** Distribución por clase de activo, calculada sobre la cartera en vivo. */
export function AssetAllocation() {
  const { allocation } = usePortfolio();
  const [largest] = [...allocation].sort((a, b) => b.amount - a.amount);

  return (
    <Card className="flex h-full flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-1 whitespace-nowrap text-base font-bold">
          <Icon name="icon-pie" width={17} height={17} />
          Distribución de Activos
        </h2>
        <Badge>Total 100%</Badge>
      </div>

      <div className="mx-auto py-3">
        <Donut label="Distribución de la cartera por clase de activo" slices={allocation.map((a) => ({ value: a.amount, color: a.color }))} size={192}>
          <span className="text-label uppercase text-fg-subtle">Activo mayor</span>
          <span className="text-2xl font-bold tracking-[-0.36px]">{largest?.pct ?? 0}%</span>
          <span className="text-label uppercase text-primary">{largest?.label.split(" ")[0]}</span>
        </Donut>
      </div>

      <ul className="flex flex-col gap-1">
        {allocation.map((slice, i) => (
          <li key={slice.label} className="flex items-center justify-between rounded-lg bg-surface-high/60 p-1.5 text-xs">
            <span className="flex items-center gap-2">
              <span aria-hidden className="size-2.5 rounded-full" style={{ background: slice.color }} />
              {slice.label}
            </span>
            <span className="flex items-center gap-3 font-mono">
              <span className="font-medium">${formatInteger(slice.amount)}</span>
              <span className={`text-label w-8 text-right ${PCT_COLORS[i]}`}>{slice.pct}%</span>
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
