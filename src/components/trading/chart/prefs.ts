"use client";

import { useLocalStore } from "@/lib/store/local-store";
import type { Frame } from "@/lib/chart-time";

export type ChartType = "candles" | "bars" | "heikin" | "line" | "area";
export type IndicatorId = "ema20" | "ema50" | "sma200" | "bb" | "vwap" | "volume" | "rsi" | "macd";

export const CHART_TYPES: { id: ChartType; label: string }[] = [
  { id: "candles", label: "Velas" },
  { id: "bars", label: "Barras OHLC" },
  { id: "heikin", label: "Heikin Ashi" },
  { id: "line", label: "Línea" },
  { id: "area", label: "Área" },
];

export const INDICATORS: { id: IndicatorId; label: string; color: string; pane?: "sub" }[] = [
  { id: "ema20", label: "EMA 20", color: "var(--color-primary-strong)" },
  { id: "ema50", label: "EMA 50", color: "#f5b942" },
  { id: "sma200", label: "SMA 200", color: "#c084fc" },
  { id: "bb", label: "Bandas de Bollinger (20, 2)", color: "#38bdf8" },
  { id: "vwap", label: "VWAP", color: "#f472b6" },
  { id: "volume", label: "Volumen", color: "var(--color-fg-subtle)" },
  { id: "rsi", label: "RSI (14)", color: "var(--color-primary)", pane: "sub" },
  { id: "macd", label: "MACD (12, 26, 9)", color: "var(--color-primary-strong)", pane: "sub" },
];

export interface ChartPrefs {
  frame: Frame;
  type: ChartType;
  indicators: Record<IndicatorId, boolean>;
}

const DEFAULT_PREFS: ChartPrefs = {
  frame: "15m",
  type: "candles",
  indicators: { ema20: true, ema50: true, sma200: false, bb: false, vwap: false, volume: true, rsi: false, macd: false },
};

/** Preferencias del gráfico (temporalidad, tipo e indicadores), compartidas entre Operar y la terminal. */
export function useChartPrefs() {
  const [stored, set] = useLocalStore<ChartPrefs>("chart-prefs", DEFAULT_PREFS);
  const prefs: ChartPrefs = { ...DEFAULT_PREFS, ...stored, indicators: { ...DEFAULT_PREFS.indicators, ...stored.indicators } };
  return [prefs, set] as const;
}
