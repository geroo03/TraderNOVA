"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { performanceStats } from "@/lib/mock-data";

const BENCHMARKS = [
  { id: "portfolio", label: "Mi Cartera", dot: "bg-primary" },
  { id: "merval", label: "S&P Merval", dot: "bg-fg-subtle" },
  { id: "mep", label: "Dólar MEP", dot: "bg-positive" },
] as const;

const RANGES = ["1D", "1S", "1M", "YTD", "1A", "MAX"] as const;
type Range = (typeof RANGES)[number];

const Y_LABELS = ["$25.500k", "$24.000k", "$22.500k", "$21.000k"];
const X_LABELS = ["01 Feb", "05 Feb", "10 Feb", "15 Feb", "20 Feb", "25 Feb"];

const toneText = { positive: "text-positive", neutral: "text-fg-subtle", negative: "text-negative", primary: "text-primary" } as const;

/**
 * El gráfico es el SVG estático exportado del Figma. Los selectores guardan
 * estado pero todavía no cambian la serie: cuando haya datos reales, reemplazar
 * el SVG por un gráfico alimentado por datos (p. ej. Recharts o lightweight-charts).
 */
export function PerformanceChart() {
  const [range, setRange] = useState<Range>("1M");
  const [benchmark, setBenchmark] = useState<(typeof BENCHMARKS)[number]["id"]>("portfolio");

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold tracking-[-0.45px]">Evolución de Rendimiento y Equity</h2>
            <Badge tone="positive" pill className="bg-positive/10 px-2 uppercase tracking-[0.25px]">
              Rueda activa
            </Badge>
          </div>
          <p className="pt-0.5 text-xs text-fg-subtle">Seguimiento comparativo ponderado por flujos de fondos netos (MWR)</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div role="group" aria-label="Comparar con" className="flex rounded-lg bg-surface-high p-0.5">
            {BENCHMARKS.map((b) => {
              const active = benchmark === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setBenchmark(b.id)}
                  className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs ${
                    active ? "bg-surface-highest font-semibold text-primary" : "text-fg-muted"
                  }`}
                >
                  <span aria-hidden className={`size-2 rounded-full ${b.dot}`} />
                  {b.label}
                </button>
              );
            })}
          </div>
          <div role="group" aria-label="Período" className="flex rounded-lg bg-surface-high p-0.5">
            {RANGES.map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={range === r}
                onClick={() => setRange(r)}
                className={`text-label rounded px-2.5 py-1 ${range === r ? "bg-primary text-on-primary" : "text-fg-muted"}`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      <figure className="relative flex h-72 flex-col justify-between overflow-hidden rounded-lg bg-surface-lowest p-3">
        <div aria-hidden className="absolute inset-x-1/3 top-10 h-32 rounded-full bg-primary/10 blur-[32px]" />
        <div aria-hidden className="absolute inset-3 flex flex-col justify-between">
          {Y_LABELS.map((label) => (
            <div key={label} className="flex items-center">
              <span className="h-px flex-1 bg-surface-higher/60" />
              <span className="pl-2 font-mono text-[11px] text-fg-subtle">{label}</span>
            </div>
          ))}
        </div>
        <div className="relative h-[200px] pt-2">
          <Icon name="performance-chart" width={939} height={192} className="h-48 w-full" />
        </div>
        <figcaption className="sr-only">Evolución del patrimonio de la cartera frente al S&amp;P Merval y el dólar MEP.</figcaption>
        <div aria-hidden className="relative flex items-center justify-between px-1 pt-1 font-mono text-[11px] text-fg-subtle">
          {X_LABELS.map((l) => (
            <span key={l}>{l}</span>
          ))}
          <span className="font-semibold text-primary">Hoy</span>
        </div>
        <div className="absolute top-5 right-[1.17%] left-[68%] rounded-lg bg-surface-higher px-3 py-1.5 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-label text-fg-subtle">18 FEB 2025 · 15:45</span>
            <span className="text-label text-positive">+18,4% ganancia acum.</span>
          </div>
          <p className="font-mono text-sm font-semibold">$24.850.340,00 ARS</p>
        </div>
      </figure>

      <dl className="grid grid-cols-2 gap-2 pt-1 lg:grid-cols-4">
        {performanceStats.map((stat) => (
          <div key={stat.label} className="rounded-lg bg-surface-high p-2">
            <dt className="text-label uppercase tracking-[0.25px] text-fg-subtle">{stat.label}</dt>
            <dd
              className={`pt-0.5 font-mono text-sm font-semibold ${
                "valueTone" in stat ? toneText[stat.valueTone] : "text-fg"
              }`}
            >
              {stat.value}
            </dd>
            <dd className={`text-label ${toneText[stat.tone]}`}>{stat.note}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
