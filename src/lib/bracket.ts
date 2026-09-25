import type { Side } from "./order-costs";

/** Stop y target asociados a una entrada (estilo "ATM Strategy"). */
export interface Bracket {
  stop: number;
  target: number;
}

export interface BracketTemplate {
  id: string;
  label: string;
  /** Distancia del stop y del target respecto del precio de entrada, en %. */
  stopPct: number;
  targetPct: number;
}

/** Plantillas reutilizables: un clic carga stop y target con una relación riesgo/beneficio fija. */
export const BRACKET_TEMPLATES: BracketTemplate[] = [
  { id: "conservative", label: "Conservadora −1% / +2%", stopPct: 1, targetPct: 2 },
  { id: "standard", label: "Estándar −2% / +4%", stopPct: 2, targetPct: 4 },
  { id: "aggressive", label: "Agresiva −3% / +9%", stopPct: 3, targetPct: 9 },
];

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Stop y target a partir de porcentajes. En la venta (corto) los lados se invierten. */
export function bracketFromPct(side: Side, entry: number, stopPct: number, targetPct: number): Bracket {
  const dir = side === "buy" ? 1 : -1;
  return {
    stop: round2(entry * (1 - (dir * stopPct) / 100)),
    target: round2(entry * (1 + (dir * targetPct) / 100)),
  };
}

export const defaultBracket = (side: Side, entry: number): Bracket => bracketFromPct(side, entry, 2, 4);

/** Devuelve el motivo por el que el bracket es inválido, o null si es coherente con la entrada. */
export function validateBracket(side: Side, entry: number, b: Bracket): string | null {
  if (!Number.isFinite(b.stop) || !Number.isFinite(b.target) || b.stop <= 0 || b.target <= 0) return "Ingresá stop y target válidos.";
  if (side === "buy") {
    if (b.stop >= entry) return "En una compra el stop debe estar por debajo del precio de entrada.";
    if (b.target <= entry) return "En una compra el target debe estar por encima del precio de entrada.";
  } else {
    if (b.stop <= entry) return "En una venta el stop debe estar por encima del precio de entrada.";
    if (b.target >= entry) return "En una venta el target debe estar por debajo del precio de entrada.";
  }
  return null;
}

export interface BracketRisk {
  maxLoss: number;
  maxGain: number;
  /** Beneficio potencial por unidad de riesgo (0 si no hay riesgo definido). */
  ratio: number;
}

export function bracketRisk(quantity: number, entry: number, b: Bracket): BracketRisk {
  const maxLoss = Math.abs(entry - b.stop) * quantity;
  const maxGain = Math.abs(b.target - entry) * quantity;
  return { maxLoss, maxGain, ratio: maxLoss > 0 ? maxGain / maxLoss : 0 };
}

/** Desvío relativo del precio ingresado respecto del de mercado (0,05 = 5%). */
export function priceDeviation(price: number, market: number): number {
  return market > 0 ? Math.abs(price / market - 1) : 0;
}

/** Por encima de este desvío la boleta avisa y exige confirmación (protege de errores de tipeo). */
export const MAX_PRICE_DEVIATION = 0.05;
