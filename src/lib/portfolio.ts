import { walk } from "./random";

export type AssetClass = "CEDEAR" | "Acción" | "Bono";

interface HoldingInput {
  symbol: string;
  name: string;
  assetClass: AssetClass;
  tag: string;
  quantity: number;
  /** Precio promedio de compra (PPC). */
  avgPrice: number;
  lastPrice: number;
  dayChangePct: number;
  currency: "ARS" | "USD";
}

export interface Holding extends HoldingInput {
  valuation: number;
  gain: number;
  gainPct: number;
}

/** Bonos cotizan cada 100 VN; el resto por unidad. */
function unitDivisor(c: AssetClass) {
  return c === "Bono" ? 100 : 1;
}

export function valueHolding(h: HoldingInput): Holding {
  const d = unitDivisor(h.assetClass);
  const valuation = (h.quantity * h.lastPrice) / d;
  const cost = (h.quantity * h.avgPrice) / d;
  return { ...h, valuation, gain: valuation - cost, gainPct: cost ? ((valuation - cost) / cost) * 100 : 0 };
}

const raw: HoldingInput[] = [
  { symbol: "MELI", name: "MercadoLibre Inc.", assetClass: "CEDEAR", tag: "CEDEAR 60:1", quantity: 150, avgPrice: 19_400, lastPrice: 26_700, dayChangePct: 4.2, currency: "ARS" },
  { symbol: "AAPL", name: "Apple Inc.", assetClass: "CEDEAR", tag: "CEDEAR 10:1", quantity: 300, avgPrice: 14_200, lastPrice: 18_350, dayChangePct: 1.15, currency: "ARS" },
  { symbol: "GGAL", name: "Grupo Financiero Galicia", assetClass: "Acción", tag: "BYMA Local", quantity: 1_200, avgPrice: 3_600, lastPrice: 4_850, dayChangePct: 3.65, currency: "ARS" },
  { symbol: "YPFD", name: "YPF S.A. Clase D", assetClass: "Acción", tag: "BYMA Local", quantity: 180, avgPrice: 22_500, lastPrice: 28_450, dayChangePct: 1.82, currency: "ARS" },
  { symbol: "NVDA", name: "NVIDIA Corporation", assetClass: "CEDEAR", tag: "CEDEAR 24:1", quantity: 80, avgPrice: 18_900, lastPrice: 18_420, dayChangePct: 2.8, currency: "ARS" },
  { symbol: "AL30D", name: "Bonar 2030 (USD)", assetClass: "Bono", tag: "Bono Soberano", quantity: 2_500, avgPrice: 48.5, lastPrice: 58.4, dayChangePct: 0.6, currency: "USD" },
];

export const holdings: Holding[] = raw.map(valueHolding);

export const equityCurve = {
  portfolio: walk(11, 60, 134.75, 0.012, 0.006),
  merval: walk(12, 60, 124.2, 0.014, 0.004),
  mep: walk(13, 60, 108.35, 0.006, 0.0015),
};

export const accountBalances = {
  arsAvailable: 3_820_400,
  usdAvailable: 1_450,
  committed: 650_000,
  pendingSettlement: 0,
  historicGain: 6_410_200,
  historicGainPct: 34.75,
} as const;
