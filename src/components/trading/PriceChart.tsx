"use client";

import { useMemo, useState } from "react";
import { CandleChart, candleScale } from "@/components/charts/CandleChart";
import { LineChart } from "@/components/charts/LineChart";
import { MsIcon } from "@/components/ui/MsIcon";
import { Tabs } from "@/components/ui/Tabs";
import { formatDecimal } from "@/lib/format";
import { movingAverage } from "@/lib/chart-math";
import { findInstrument, priceCandles, type Instrument } from "@/lib/market-data";
import { useLocalStore } from "@/lib/store/local-store";
import { KEYS } from "@/lib/store/demo-data";
import { ChartDrawings, type DrawTool, type Drawing } from "./ChartDrawings";
import type { MsIconName } from "@/components/ui/ms-icon-names";
import type { TicketLevels } from "./useTicketLevels";
import { ChartOrderLines, type ChartLine } from "./ChartOrderLines";

const FRAMES = ["1m", "5m", "15m", "1H", "1D", "1S"] as const;
type Frame = (typeof FRAMES)[number];
const COUNT: Record<Frame, number> = { "1m": 70, "5m": 60, "15m": 55, "1H": 48, "1D": 60, "1S": 40 };

const TOOLS: { id: DrawTool; icon: MsIconName; label: string }[] = [
  { id: "cursor", icon: "arrow_selector_tool", label: "Cursor" },
  { id: "trend", icon: "show_chart", label: "Línea de tendencia" },
  { id: "hline", icon: "horizontal_rule", label: "Línea horizontal" },
  { id: "measure", icon: "straighten", label: "Medir" },
  { id: "text", icon: "text_fields", label: "Texto" },
];

const NO_DRAWINGS: Record<string, Drawing[]> = {};

interface PriceChartProps {
  instrument: Instrument;
  withRsi?: boolean;
  height?: string;
  /** Si se pasan, el gráfico muestra las líneas de la boleta y permite arrastrarlas. */
  levels?: TicketLevels;
  onLevelsChange?: (levels: TicketLevels) => void;
}

/** Gráfico de velas con temporalidades, medias móviles y RSI opcional. */
export function PriceChart({ instrument, withRsi = false, height = "h-80", levels, onLevelsChange }: PriceChartProps) {
  const [frame, setFrame] = useState<Frame>("15m");
  const [tool, setTool] = useState<DrawTool>("cursor");
  const [allDrawings, setAllDrawings] = useLocalStore(KEYS.drawings, NO_DRAWINGS);
  const drawKey = `${instrument.symbol}-${frame}`;
  const drawings = allDrawings[drawKey] ?? [];
  // La serie se genera con el precio de referencia (estable) y solo la última vela sigue el precio en vivo;
  // si se regenerara con cada tick, todo el gráfico "temblaría".
  const refPrice = findInstrument(instrument.symbol)?.price ?? instrument.price;
  const history = useMemo(() => priceCandles(`${instrument.symbol}-${frame}`, refPrice, COUNT[frame]), [instrument.symbol, refPrice, frame]);
  const data = useMemo(() => {
    const last = history[history.length - 1];
    const live = instrument.price;
    return [...history.slice(0, -1), { ...last, close: live, high: Math.max(last.high, live), low: Math.min(last.low, live) }];
  }, [history, instrument.price]);
  const closes = useMemo(() => data.map((d) => d.close), [data]);
  const ema20 = movingAverage(closes, 20).at(-1) ?? 0;
  const ema50 = movingAverage(closes, 50).at(-1) ?? 0;
  const rsi = useMemo(() => rsiSeries(closes), [closes]);
  const scale = candleScale(data);
  const lines = levels && onLevelsChange ? orderLines(levels, onLevelsChange, instrument.price) : [];

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
          {TOOLS.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-label={t.label}
              title={t.label}
              aria-pressed={tool === t.id}
              onClick={() => setTool(t.id)}
              className={`rounded p-1.5 ${tool === t.id ? "bg-primary-strong/20 text-primary" : "text-fg-subtle hover:bg-surface-high"}`}
            >
              <MsIcon name={t.icon} size={16} />
            </button>
          ))}
          <button
            type="button"
            aria-label="Borrar dibujos"
            title="Borrar dibujos"
            disabled={drawings.length === 0}
            onClick={() => setAllDrawings((d) => ({ ...d, [drawKey]: [] }))}
            className="mt-2 rounded p-1.5 text-fg-subtle hover:bg-surface-high hover:text-negative disabled:opacity-30"
          >
            <MsIcon name="delete" size={16} />
          </button>
        </div>
        <div className={`min-w-0 flex-1 rounded-lg bg-surface-lowest p-2 ${height}`}>
          <div className="relative h-full">
            <CandleChart
              data={data}
              label={`Velas de ${instrument.symbol} en ${frame}`}
              averages={[
                { period: 20, color: "var(--color-primary-strong)" },
                { period: 50, color: "#f5b942" },
              ]}
            />
            <ChartDrawings
              tool={tool}
              drawings={drawings}
              onAdd={(d) => setAllDrawings((all) => ({ ...all, [drawKey]: [...(all[drawKey] ?? []), d] }))}
              lo={scale.lo}
              hi={scale.hi}
              priceFraction={scale.priceFraction}
            />
            {lines.length > 0 && <ChartOrderLines lines={lines} lo={scale.lo} hi={scale.hi} priceFraction={scale.priceFraction} />}
          </div>
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
        {lines.length > 0 && <span className="text-primary">Arrastrá las etiquetas para ajustar precio, stop y target.</span>}
      </p>
    </div>
  );
}

/** Líneas de la boleta: mover la de entrada en una orden a mercado la convierte en límite. */
function orderLines(levels: TicketLevels, onChange: (l: TicketLevels) => void, market: number): ChartLine[] {
  const lines: ChartLine[] = [
    {
      id: "entry",
      label: levels.type === "Mercado" ? "Mercado" : "Entrada",
      value: levels.type === "Mercado" ? market : levels.price,
      tone: "primary",
      onChange: (price) => onChange({ ...levels, price, type: levels.type === "Mercado" ? "Límite" : levels.type }),
    },
  ];
  const b = levels.bracket;
  if (b) {
    lines.push(
      { id: "stop", label: "SL", value: b.stop, tone: "negative", onChange: (stop) => onChange({ ...levels, bracket: { ...b, stop } }) },
      { id: "target", label: "TP", value: b.target, tone: "positive", onChange: (target) => onChange({ ...levels, bracket: { ...b, target } }) },
    );
  }
  return lines;
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
