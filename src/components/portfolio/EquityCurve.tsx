"use client";

import { useState } from "react";
import { LineChart } from "@/components/charts/LineChart";
import { Tabs } from "@/components/ui/Tabs";
import { formatPercent } from "@/lib/format";
import { equityCurve } from "@/lib/portfolio";

const RANGES = { "1M": 22, "3M": 40, "6M": 50, YTD: 55, "1A": 60, TODO: 60 } as const;
type Range = keyof typeof RANGES;

/** Serie rebasada a 100 al inicio del rango, para comparar rendimientos relativos. */
function rebase(values: number[], n: number): number[] {
  const slice = values.slice(-n);
  return slice.map((v) => (v / slice[0]) * 100);
}

export function EquityCurve() {
  const [range, setRange] = useState<Range>("6M");
  const n = RANGES[range];
  const p = rebase(equityCurve.portfolio, n);
  const m = rebase(equityCurve.merval, n);
  const d = rebase(equityCurve.mep, n);
  const ret = (s: number[]) => (s[s.length - 1] ?? 100) - 100;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-end">
        <Tabs size="sm" label="Rango" value={range} onChange={setRange} items={(Object.keys(RANGES) as Range[]).map((r) => ({ id: r, label: r }))} />
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
        <li className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-primary-strong" /> Mi cartera ({formatPercent(ret(p))})</li>
        <li className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-fg-subtle" /> S&amp;P Merval ({formatPercent(ret(m))})</li>
        <li className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-positive" /> Dólar MEP ({formatPercent(ret(d))})</li>
        <li className="ml-auto font-mono font-semibold text-positive">{formatPercent(ret(p) - ret(m))} alpha vs mercado</li>
      </ul>
    </div>
  );
}
