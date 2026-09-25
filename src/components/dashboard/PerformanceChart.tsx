"use client";

import { useState, type MouseEvent } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LineChart } from "@/components/charts/LineChart";
import { useFreshAccount, usePerformance } from "@/components/portfolio/usePerformance";
import { MsIcon } from "@/components/ui/MsIcon";
import { formatDecimal, formatPercent } from "@/lib/format";
import { returnPct } from "@/lib/performance";

const BENCHMARKS = [
  { id: "portfolio", label: "Mi Cartera", dot: "bg-primary", color: "var(--color-primary-strong)" },
  { id: "merval", label: "S&P Merval", dot: "bg-fg-subtle", color: "var(--color-fg-subtle)" },
  { id: "mep", label: "Dólar MEP", dot: "bg-positive", color: "var(--color-positive)" },
] as const;
type Benchmark = (typeof BENCHMARKS)[number]["id"];

const RANGES = ["1D", "1S", "1M", "YTD", "1A", "MAX"] as const;
type Range = (typeof RANGES)[number];

const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function labelAt(range: Range, i: number, n: number): string {
  const back = n - 1 - i;
  if (range === "1D") {
    const mins = 11 * 60 + Math.round((i / (n - 1)) * 360);
    return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")} hs`;
  }
  const days = range === "1S" ? back / 8 : range === "1M" ? back : range === "YTD" ? back * 1.3 : range === "1A" ? back * 7 : back * 30;
  const d = new Date(2025, 1, 18 - Math.round(days));
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** Evolución del patrimonio vs benchmarks. Series sintéticas por rango que terminan en el patrimonio actual. */
export function PerformanceChart() {
  const [range, setRange] = useState<Range>("1M");
  const [benchmark, setBenchmark] = useState<Benchmark>("portfolio");
  const [hover, setHover] = useState<number | null>(null);
  const { series: values, stats } = usePerformance(range);
  const fresh = useFreshAccount();

  const n = values.portfolio.length;
  const idx = hover ?? n - 1;
  const selected = values[benchmark];
  const ret = returnPct;
  const statCards = [
    { label: "Máximo del período", value: `$${formatDecimal(stats.max)}`, note: `Alcanzado ${labelAt(range, stats.maxIndex, n).replace(/ \d{4}$/, "")}`, tone: "text-positive", valueTone: "text-fg" },
    {
      label: "Drawdown máximo",
      value: formatPercent(stats.drawdownPct),
      note: stats.drawdownPct > -5 ? "Volatilidad controlada" : "Volatilidad alta",
      tone: "text-fg-subtle",
      valueTone: stats.drawdownPct < 0 ? "text-negative" : "text-fg",
    },
    {
      label: "Ratio de Sharpe",
      value: stats.sharpe === null ? "—" : formatDecimal(stats.sharpe),
      note: stats.sharpe === null ? "Requiere 1M o más" : stats.sharpe >= 1 ? "Rendimiento óptimo s/ riesgo" : "Rendimiento ajustado bajo",
      tone: stats.sharpe !== null && stats.sharpe >= 1 ? "text-positive" : "text-fg-subtle",
      valueTone: "text-primary",
    },
    stats.annualizedPct === null
      ? { label: "Rendimiento del período", value: formatPercent(ret(values.portfolio)), note: `En ${range}`, tone: "text-fg-subtle", valueTone: "text-fg" }
      : { label: "Rendimiento anualizado", value: `${formatPercent(stats.annualizedPct, 1)} e.a.`, note: `Base ${range}`, tone: "text-fg-subtle", valueTone: "text-fg" },
  ];

  function onMove(e: MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    setHover(Math.round(((e.clientX - r.left) / r.width) * (n - 1)));
  }

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
          <div role="group" aria-label="Destacar" className="flex rounded-lg bg-surface-high p-0.5">
            {BENCHMARKS.map((b) => {
              const active = benchmark === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setBenchmark(b.id)}
                  className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs ${active ? "bg-surface-highest font-semibold text-primary" : "text-fg-muted"}`}
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
                onClick={() => {
                  setRange(r);
                  setHover(null);
                }}
                className={`text-label rounded px-2.5 py-1 ${range === r ? "bg-primary text-on-primary" : "text-fg-muted"}`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {fresh ? (
        <div className="flex h-72 flex-col items-center justify-center gap-2 rounded-lg bg-surface-lowest p-6 text-center">
          <MsIcon name="query_stats" size={32} className="text-primary" />
          <p className="font-semibold">Tu cuenta es nueva</p>
          <p className="max-w-md text-sm text-fg-muted">La evolución de tu patrimonio se va a armar día a día a medida que ingreses dinero y operes. Mientras tanto podés practicar en el modo simulación.</p>
        </div>
      ) : (
      <figure className="relative flex h-72 flex-col overflow-hidden rounded-lg bg-surface-lowest p-3">
        <div aria-hidden className="absolute inset-x-1/3 top-10 h-32 rounded-full bg-primary/10 blur-[32px]" />
        <div className="relative min-h-0 flex-1" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
          <LineChart
            label="Evolución del patrimonio de la cartera frente al S&P Merval y el dólar MEP"
            gridLines={4}
            endDot
            series={BENCHMARKS.map((b) => ({
              values: values[b.id],
              color: b.color,
              area: b.id === benchmark,
              width: b.id === benchmark ? 2.5 : 1.2,
              dashed: b.id === "merval",
              opacity: b.id === benchmark ? 1 : 0.45,
            }))}
          />
          {hover !== null && <span aria-hidden className="pointer-events-none absolute inset-y-0 w-px bg-fg-subtle/50" style={{ left: `${(idx / (n - 1)) * 100}%` }} />}
        </div>
        <div aria-hidden className="relative flex items-center justify-between px-1 pt-2 font-mono text-[11px] text-fg-subtle">
          {[0, 0.25, 0.5, 0.75].map((f) => (
            <span key={f}>{labelAt(range, Math.round(f * (n - 1)), n).replace(/ \d{4}$/, "")}</span>
          ))}
          <span className="font-semibold text-primary">Hoy</span>
        </div>
        <div className="absolute top-5 right-4 rounded-lg bg-surface-higher px-3 py-1.5 shadow-xl sm:left-auto sm:w-72">
          <div className="flex items-center justify-between gap-3">
            <span className="text-label text-fg-subtle">{hover === null ? "Ahora" : labelAt(range, idx, n)}</span>
            <span className={`text-label ${ret(selected, idx) >= 0 ? "text-positive" : "text-negative"}`}>{formatPercent(ret(selected, idx))} en {range}</span>
          </div>
          <p className="font-mono text-sm font-semibold">${formatDecimal(selected[idx])} ARS</p>
          <p className="text-label text-fg-subtle">
            {BENCHMARKS.filter((b) => b.id !== benchmark)
              .map((b) => `${b.label} ${formatPercent(ret(values[b.id], idx))}`)
              .join(" · ")}
          </p>
        </div>
        <figcaption className="sr-only">Evolución del patrimonio de la cartera frente al S&amp;P Merval y el dólar MEP.</figcaption>
      </figure>
      )}

      {!fresh && (
      <dl className="grid grid-cols-2 gap-2 pt-1 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="rounded-lg bg-surface-high p-2">
            <dt className="text-label uppercase tracking-[0.25px] text-fg-subtle">{stat.label}</dt>
            <dd className={`pt-0.5 font-mono text-sm font-semibold ${stat.valueTone}`}>{stat.value}</dd>
            <dd className={`text-label ${stat.tone}`}>{stat.note}</dd>
          </div>
        ))}
      </dl>
      )}
    </Card>
  );
}
