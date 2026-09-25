"use client";

import { useMemo, useState, type MouseEvent } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LineChart } from "@/components/charts/LineChart";
import { usePortfolio } from "@/components/portfolio/usePortfolio";
import { formatDecimal, formatPercent } from "@/lib/format";
import { performanceStats } from "@/lib/mock-data";
import { walk } from "@/lib/random";

const BENCHMARKS = [
  { id: "portfolio", label: "Mi Cartera", dot: "bg-primary", color: "var(--color-primary-strong)" },
  { id: "merval", label: "S&P Merval", dot: "bg-fg-subtle", color: "var(--color-fg-subtle)" },
  { id: "mep", label: "Dólar MEP", dot: "bg-positive", color: "var(--color-positive)" },
] as const;
type Benchmark = (typeof BENCHMARKS)[number]["id"];

const RANGES = ["1D", "1S", "1M", "YTD", "1A", "MAX"] as const;
type Range = (typeof RANGES)[number];

/** Cantidad de puntos, volatilidad y deriva de cada rango (datos sintéticos con semilla fija). */
const SHAPE: Record<Range, { n: number; vol: number; drift: number; growth: number }> = {
  "1D": { n: 36, vol: 0.002, drift: 0.0005, growth: 1.02 },
  "1S": { n: 5 * 8, vol: 0.004, drift: 0.0006, growth: 1.035 },
  "1M": { n: 22, vol: 0.009, drift: 0.003, growth: 1.08 },
  YTD: { n: 40, vol: 0.012, drift: 0.006, growth: 1.19 },
  "1A": { n: 52, vol: 0.02, drift: 0.008, growth: 1.35 },
  MAX: { n: 60, vol: 0.03, drift: 0.012, growth: 1.9 },
};

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
  const { total } = usePortfolio();
  // Se ancla al patrimonio de referencia para no redibujar todo con cada tick; el último punto sí es el vivo.
  const [anchor] = useState(total);

  const series = useMemo(() => {
    const { n, vol, drift, growth } = SHAPE[range];
    const seed = RANGES.indexOf(range) * 10;
    const portfolio = walk(seed + 1, n, anchor, vol, drift);
    // Benchmarks rebasados al mismo punto de partida para comparar rendimiento relativo.
    const start = anchor / growth;
    const merval = walk(seed + 2, n, start * (1 + (growth - 1) * 0.7), vol * 1.2, drift * 0.7).map((v, _, a) => (v / a[0]) * portfolio[0]);
    const mep = walk(seed + 3, n, start * (1 + (growth - 1) * 0.3), vol * 0.5, drift * 0.3).map((v, _, a) => (v / a[0]) * portfolio[0]);
    return { portfolio, merval, mep };
  }, [range, anchor]);

  const values = { ...series, portfolio: [...series.portfolio.slice(0, -1), total] };
  const n = values.portfolio.length;
  const idx = hover ?? n - 1;
  const selected = values[benchmark];
  const ret = (s: number[], i = s.length - 1) => (s[i] / s[0] - 1) * 100;

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

      <dl className="grid grid-cols-2 gap-2 pt-1 lg:grid-cols-4">
        {performanceStats.map((stat) => (
          <div key={stat.label} className="rounded-lg bg-surface-high p-2">
            <dt className="text-label uppercase tracking-[0.25px] text-fg-subtle">{stat.label}</dt>
            <dd className={`pt-0.5 font-mono text-sm font-semibold ${"valueTone" in stat ? { positive: "text-positive", neutral: "text-fg", negative: "text-negative", primary: "text-primary" }[stat.valueTone] : "text-fg"}`}>
              {stat.value}
            </dd>
            <dd className={`text-label ${{ positive: "text-positive", neutral: "text-fg-subtle", negative: "text-negative", primary: "text-primary" }[stat.tone]}`}>{stat.note}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
