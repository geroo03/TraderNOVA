/**
 * Historia de rendimiento de la cartera (sintética, con semilla fija) y sus estadísticas.
 * Cada serie termina en el patrimonio de referencia, así los rendimientos del dashboard,
 * de Tenencia y de los KPIs salen de los mismos datos.
 */
import { walk } from "./random";

export const RANGES = ["1D", "1S", "1M", "3M", "6M", "YTD", "1A", "MAX"] as const;
export type Range = (typeof RANGES)[number];

interface Shape {
  /** Semilla de la caminata aleatoria de la cartera. */
  seed: number;
  /** Puntos de la serie. */
  n: number;
  vol: number;
  drift: number;
  /** Cuánto creció el Merval / el MEP relativo a la cartera (0..1). */
  merval: number;
  mep: number;
  /** Años que cubre el rango (para anualizar). */
  years: number;
}

// Calibrado para valores creíbles en pesos (Sharpe ~1–2,5, anualizado ~20–60%). Las semillas se
// eligieron para que cada rango caiga en esas bandas; cambiar vol/drift obliga a revisarlas.
const SHAPE: Record<Range, Shape> = {
  "1D": { seed: 5, n: 36, vol: 0.004, drift: 0.0003, merval: 0.4, mep: 0.2, years: 1 / 252 },
  "1S": { seed: 3, n: 40, vol: 0.006, drift: 0.0005, merval: 0.5, mep: 0.25, years: 5 / 252 },
  "1M": { seed: 24, n: 22, vol: 0.022, drift: 0.0015, merval: 0.62, mep: 0.3, years: 21 / 252 },
  "3M": { seed: 5, n: 40, vol: 0.028, drift: 0.0023, merval: 0.7, mep: 0.3, years: 63 / 252 },
  "6M": { seed: 11, n: 50, vol: 0.035, drift: 0.0034, merval: 0.72, mep: 0.32, years: 126 / 252 },
  YTD: { seed: 5, n: 40, vol: 0.022, drift: 0.0015, merval: 0.7, mep: 0.3, years: 0.14 },
  "1A": { seed: 2, n: 52, vol: 0.05, drift: 0.0068, merval: 0.75, mep: 0.35, years: 1 },
  MAX: { seed: 1, n: 60, vol: 0.1, drift: 0.018, merval: 0.8, mep: 0.4, years: 5 },
};

export interface PerformanceSeries {
  portfolio: number[];
  merval: number[];
  mep: number[];
}

/**
 * Caminata aleatoria que empieza exactamente en `from` y termina en `to` (puente geométrico):
 * se le quita a la caminata su tendencia propia y se le aplica la recta de `from` a `to`.
 */
function bridge(seed: number, n: number, from: number, to: number, vol: number): number[] {
  const raw = walk(seed, n, 1, vol, 0);
  const r0 = raw[0];
  const rl = raw[n - 1];
  return raw.map((v, i) => {
    const t = n > 1 ? i / (n - 1) : 1;
    return from * (to / from) ** t * (v / (r0 * (rl / r0) ** t));
  });
}

/** Series de la cartera y los benchmarks (rebasados al mismo punto de partida), terminando en `anchor`. */
export function performanceSeries(range: Range, anchor: number): PerformanceSeries {
  const s = SHAPE[range];
  const portfolio = walk(s.seed, s.n, anchor, s.vol, s.drift);
  const start = portfolio[0];
  const growth = anchor / start - 1;
  const bench = (k: number, share: number, volK: number) => bridge(s.seed + k, s.n, start, start * (1 + growth * share), s.vol * volK);
  return { portfolio, merval: bench(1_000, s.merval, 1.1), mep: bench(2_000, s.mep, 0.4) };
}

/** Rendimiento porcentual entre el primer punto y el índice `i` (por defecto, el último). */
export function returnPct(values: number[], i = values.length - 1): number {
  return values.length && values[0] ? (values[i] / values[0] - 1) * 100 : 0;
}

export interface SeriesStats {
  max: number;
  maxIndex: number;
  /** Caída máxima desde un pico, en % (negativo o cero). */
  drawdownPct: number;
  /** Sharpe anualizado con tasa libre de riesgo 0; null en rangos menores a un mes. */
  sharpe: number | null;
  /** Rendimiento anualizado en %; null en rangos menores a un mes. */
  annualizedPct: number | null;
}

export function seriesStats(values: number[], range: Range): SeriesStats {
  let max = -Infinity;
  let maxIndex = 0;
  let peak = values[0] ?? 0;
  let drawdown = 0;
  values.forEach((v, i) => {
    if (v > max) {
      max = v;
      maxIndex = i;
    }
    peak = Math.max(peak, v);
    if (peak > 0) drawdown = Math.min(drawdown, (v / peak - 1) * 100);
  });

  const { years } = SHAPE[range];
  const meaningful = years >= 21 / 252;
  const rets = values.slice(1).map((v, i) => (values[i] ? v / values[i] - 1 : 0));
  const mean = rets.reduce((a, r) => a + r, 0) / (rets.length || 1);
  const sd = Math.sqrt(rets.reduce((a, r) => a + (r - mean) ** 2, 0) / (rets.length || 1));
  const perYear = rets.length / years;
  const total = values.length && values[0] ? values[values.length - 1] / values[0] : 1;

  return {
    max,
    maxIndex,
    drawdownPct: drawdown,
    sharpe: meaningful && sd > 0 ? (mean / sd) * Math.sqrt(perYear) : null,
    annualizedPct: meaningful ? (total ** (1 / years) - 1) * 100 : null,
  };
}
