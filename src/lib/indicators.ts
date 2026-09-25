/**
 * Indicadores técnicos para el gráfico (funciones puras). Devuelven `null` donde todavía no hay
 * datos suficientes, para que el gráfico no dibuje valores engañosos al principio de la serie.
 */
import type { Ohlc } from "./chart-math";

export type Series = (number | null)[];

export function sma(values: number[], period: number): Series {
  let sum = 0;
  return values.map((v, i) => {
    sum += v;
    if (i >= period) sum -= values[i - period];
    return i >= period - 1 ? sum / period : null;
  });
}

/** Media móvil exponencial, arrancando con la SMA de los primeros `period` valores. */
export function ema(values: number[], period: number): Series {
  const k = 2 / (period + 1);
  const out: Series = [];
  let prev: number | null = null;
  values.forEach((v, i) => {
    if (i < period - 1) return out.push(null);
    if (prev === null) prev = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
    else prev = v * k + prev * (1 - k);
    out.push(prev);
  });
  return out;
}

export interface Band {
  mid: number;
  upper: number;
  lower: number;
}

/** Bandas de Bollinger: SMA ± k desvíos estándar. */
export function bollinger(values: number[], period = 20, k = 2): (Band | null)[] {
  const mid = sma(values, period);
  return values.map((_, i) => {
    const m = mid[i];
    if (m === null) return null;
    const slice = values.slice(i - period + 1, i + 1);
    const sd = Math.sqrt(slice.reduce((a, v) => a + (v - m) ** 2, 0) / period);
    return { mid: m, upper: m + k * sd, lower: m - k * sd };
  });
}

/** RSI de Wilder (suavizado exponencial de ganancias y pérdidas). */
export function rsi(values: number[], period = 14): Series {
  const out: Series = values.map(() => null);
  if (values.length <= period) return out;
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i++) {
    const d = values[i] - values[i - 1];
    if (d > 0) gain += d;
    else loss -= d;
  }
  gain /= period;
  loss /= period;
  const value = () => (loss === 0 ? 100 : 100 - 100 / (1 + gain / loss));
  out[period] = value();
  for (let i = period + 1; i < values.length; i++) {
    const d = values[i] - values[i - 1];
    gain = (gain * (period - 1) + Math.max(d, 0)) / period;
    loss = (loss * (period - 1) + Math.max(-d, 0)) / period;
    out[i] = value();
  }
  return out;
}

export interface MacdPoint {
  macd: number;
  signal: number | null;
  hist: number | null;
}

/** MACD (12, 26, 9): diferencia de EMAs, su señal y el histograma. */
export function macd(values: number[], fast = 12, slow = 26, signalPeriod = 9): (MacdPoint | null)[] {
  const f = ema(values, fast);
  const s = ema(values, slow);
  const line = values.map((_, i) => (f[i] !== null && s[i] !== null ? (f[i] as number) - (s[i] as number) : null));
  const start = line.findIndex((v) => v !== null);
  const sig = start < 0 ? [] : ema(line.slice(start) as number[], signalPeriod);
  return line.map((m, i) => {
    if (m === null) return null;
    const sv = sig[i - start] ?? null;
    return { macd: m, signal: sv, hist: sv === null ? null : m - sv };
  });
}

/** VWAP que se reinicia al comienzo de cada rueda (`sessionStart(i)` indica si la vela i abre una rueda). */
export function vwap(data: Ohlc[], sessionStart: (i: number) => boolean): number[] {
  let pv = 0;
  let vol = 0;
  return data.map((c, i) => {
    if (sessionStart(i)) {
      pv = 0;
      vol = 0;
    }
    const typical = (c.high + c.low + c.close) / 3;
    pv += typical * c.volume;
    vol += c.volume;
    return vol ? pv / vol : typical;
  });
}

/** Velas Heikin Ashi: suavizan el ruido para ver mejor la tendencia. */
export function heikinAshi(data: Ohlc[]): Ohlc[] {
  const out: Ohlc[] = [];
  data.forEach((c, i) => {
    const close = (c.open + c.high + c.low + c.close) / 4;
    const open = i === 0 ? (c.open + c.close) / 2 : (out[i - 1].open + out[i - 1].close) / 2;
    out.push({ open, close, high: Math.max(c.high, open, close), low: Math.min(c.low, open, close), volume: c.volume });
  });
  return out;
}

/** Valores "redondos" para la escala de precios (1, 2, 2,5 o 5 × 10ⁿ). */
export function niceTicks(lo: number, hi: number, maxTicks = 6): number[] {
  const span = hi - lo;
  if (!(span > 0)) return [lo];
  const raw = span / maxTicks;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag;
  // Se redondea a los decimales del paso para evitar 58,400000000000006.
  const decimals = Math.max(0, -Math.floor(Math.log10(step)) + 1);
  const ticks: number[] = [];
  for (let k = Math.ceil(lo / step); k * step <= hi + step * 1e-9; k++) ticks.push(Number((k * step).toFixed(decimals)));
  return ticks;
}
