import type { Ohlc } from "./chart-math";

/**
 * PRNG determinístico (mulberry32). Los datos de demo se generan con semilla fija
 * para que servidor y cliente rendericen exactamente lo mismo (sin errores de hidratación).
 */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Caminata aleatoria con deriva, termina exactamente en `end`. */
export function walk(seed: number, length: number, end: number, volatility = 0.02, drift = 0.002): number[] {
  const rnd = seeded(seed);
  const raw: number[] = [1];
  for (let i = 1; i < length; i++) raw.push(raw[i - 1] * (1 + drift + (rnd() - 0.5) * 2 * volatility));
  const k = end / raw[raw.length - 1];
  return raw.map((v) => v * k);
}

/** Velas OHLC sintéticas que cierran en `lastClose`. */
export function candles(seed: number, length: number, lastClose: number, volatility = 0.018): Ohlc[] {
  const rnd = seeded(seed * 7 + 3);
  const closes = walk(seed, length, lastClose, volatility, 0.003);
  return closes.map((close, i) => {
    const open = i === 0 ? close * (1 - volatility / 2) : closes[i - 1];
    const wick = close * volatility * (0.3 + rnd());
    return {
      open,
      close,
      high: Math.max(open, close) + wick * rnd(),
      low: Math.min(open, close) - wick * rnd(),
      volume: Math.round(40_000 + rnd() * 160_000),
    };
  });
}
