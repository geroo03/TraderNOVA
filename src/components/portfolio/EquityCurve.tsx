"use client";

import { useState } from "react";
import { LineChart } from "@/components/charts/LineChart";
import { Tabs } from "@/components/ui/Tabs";
import { formatPercent } from "@/lib/format";
import { returnPct, type Range } from "@/lib/performance";
import { useFreshAccount, usePerformance } from "./usePerformance";

const RANGES = ["1M", "3M", "6M", "YTD", "1A", "MAX"] as const satisfies readonly Range[];
type CurveRange = (typeof RANGES)[number];

/** Serie rebasada a 100 al inicio del rango, para comparar rendimientos relativos. */
const rebase = (values: number[]) => values.map((v) => (v / values[0]) * 100);

/** Curva patrimonial vs Merval y MEP; usa las mismas series que el dashboard. */
export function EquityCurve() {
  const [range, setRange] = useState<CurveRange>("6M");
  const { series } = usePerformance(range);
  const fresh = useFreshAccount();
  const p = rebase(series.portfolio);
  const m = rebase(series.merval);
  const d = rebase(series.mep);

  if (fresh)
    return <p className="flex h-56 items-center justify-center rounded-lg bg-surface-lowest p-6 text-center text-sm text-fg-muted">Todavía no hay historia: la curva se arma a medida que tu cuenta tenga movimientos.</p>;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Tabs size="sm" label="Rango" value={range} onChange={setRange} items={RANGES.map((r) => ({ id: r, label: r }))} />
      </div>
      <div className="h-56 rounded-lg bg-surface-lowest p-3">
        <LineChart
          label="Curva de crecimiento patrimonial vs Merval y dólar MEP"
          gridLines={3}
          endDot
          series={[
            { values: p, color: "var(--color-primary-strong)", area: true, width: 2.5 },
            { values: m, color: "var(--color-fg-subtle)", dashed: true, width: 1.5 },
            { values: d, color: "var(--color-positive)", width: 1.2, opacity: 0.7 },
          ]}
        />
      </div>
      <ul className="flex flex-wrap items-center gap-4 text-xs">
        <li className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-primary-strong" /> Mi cartera ({formatPercent(returnPct(p))})</li>
        <li className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-fg-subtle" /> S&amp;P Merval ({formatPercent(returnPct(m))})</li>
        <li className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-positive" /> Dólar MEP ({formatPercent(returnPct(d))})</li>
        <li className={`ml-auto font-mono font-semibold ${returnPct(p) >= returnPct(m) ? "text-positive" : "text-negative"}`}>{formatPercent(returnPct(p) - returnPct(m))} alpha vs mercado</li>
      </ul>
    </div>
  );
}
