"use client";

import { useMemo, useState } from "react";
import { CandleChart } from "@/components/charts/CandleChart";
import { LineChart } from "@/components/charts/LineChart";
import { MsIcon } from "@/components/ui/MsIcon";
import { Tabs } from "@/components/ui/Tabs";
import { formatDecimal } from "@/lib/format";
import { movingAverage } from "@/lib/chart-math";
import { priceCandles, type Instrument } from "@/lib/market-data";
import type { MsIconName } from "@/components/ui/ms-icon-names";

const FRAMES = ["1m", "5m", "15m", "1H", "1D", "1S"] as const;
type Frame = (typeof FRAMES)[number];
const COUNT: Record<Frame, number> = { "1m": 70, "5m": 60, "15m": 55, "1H": 48, "1D": 60, "1S": 40 };

const TOOLS: { icon: MsIconName; label: string }[] = [
  { icon: "arrow_selector_tool", label: "Cursor" },
  { icon: "show_chart", label: "Línea de tendencia" },
  { icon: "horizontal_rule", label: "Línea horizontal" },
  { icon: "straighten", label: "Medir" },
  { icon: "text_fields", label: "Texto" },
];

/** Gráfico de velas con temporalidades, medias móviles y RSI opcional. */
export function PriceChart({ instrument, withRsi = false, height = "h-80" }: { instrument: Instrument; withRsi?: boolean; height?: string }) {
  const [frame, setFrame] = useState<Frame>("15m");
  const [tool, setTool] = useState(0);
  const data = useMemo(
    () => priceCandles(`${instrument.symbol}-${frame}`, instrument.price, COUNT[frame]),
    [instrument.symbol, instrument.price, frame],
  );
  const closes = useMemo(() => data.map((d) => d.close), [data]);
  const ema20 = movingAverage(closes, 20).at(-1) ?? 0;
  const ema50 = movingAverage(closes, 50).at(-1) ?? 0;
  const rsi = useMemo(() => rsiSeries(closes), [closes]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Tabs size="sm" label="Temporalidad" value={frame} onChange={setFrame} items={FRAMES.map((f) => ({ id: f, label: f }))} />
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-label rounded bg-primary-strong/15 px-2 py-0.5 text-primary">EMA 20 (${formatDecimal(ema20)})</span>
          <span className="text-label rounded bg-[#f5b942]/15 px-2 py-0.5 text-[#f5b942]">EMA 50 (${formatDecimal(ema50)})</span>
        </div>
      </div>
      <div className="flex gap-2">
        <div role="toolbar" aria-label="Herramientas de dibujo" className="hidden flex-col gap-1 sm:flex">
          {TOOLS.map((t, i) => (
            <button
              key={t.icon}
              type="button"
              aria-label={t.label}
              aria-pressed={tool === i}
              onClick={() => setTool(i)}
              className={`rounded p-1.5 ${tool === i ? "bg-primary-strong/20 text-primary" : "text-fg-subtle hover:bg-surface-high"}`}
            >
              <MsIcon name={t.icon} size={16} />
            </button>
          ))}
        </div>
        <div className={`min-w-0 flex-1 rounded-lg bg-surface-lowest p-2 ${height}`}>
          <CandleChart
            data={data}
            label={`Velas de ${instrument.symbol} en ${frame}`}
            averages={[
              { period: 20, color: "var(--color-primary-strong)" },
              { period: 50, color: "#f5b942" },
            ]}
          />
        </div>
      </div>
      {withRsi && (
        <div className="rounded-lg bg-surface-lowest p-2">
          <div className="text-label flex justify-between text-fg-subtle">
            <span>RSI (14) · {rsi.at(-1)?.toFixed(1)}</span>
            <span>70 / 30</span>
          </div>
          <div className="h-16">
            <LineChart series={[{ values: rsi, color: "var(--color-primary)", width: 1.5 }]} width={800} height={64} gridLines={1} label="RSI 14" />
          </div>
        </div>
      )}
      <p className="text-label flex flex-wrap gap-3 text-fg-subtle">
        <span>RSI (14): {rsi.at(-1)?.toFixed(1)}</span>
        <span>Fuente: Feed Directo BYMA DMA (demo)</span>
      </p>
    </div>
  );
}

/** RSI de Wilder simplificado (medias simples), suficiente para visualizar. */
function rsiSeries(closes: number[], period = 14): number[] {
  return closes.map((_, i) => {
    const from = Math.max(1, i - period + 1);
    let gain = 0;
    let loss = 0;
    for (let j = from; j <= i; j++) {
      const d = closes[j] - closes[j - 1];
      if (d > 0) gain += d;
      else loss -= d;
    }
    if (gain + loss === 0) return 50;
    return (100 * gain) / (gain + loss);
  });
}
