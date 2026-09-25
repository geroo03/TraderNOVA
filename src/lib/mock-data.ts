/**
 * Datos de ejemplo tomados del Figma. Cuando exista backend, reemplazar este
 * módulo por llamadas a la API manteniendo los mismos tipos de `./types`.
 */
import type {
  AllocationSlice,
  DollarRate,
  Mover,
  Order,
  TickerQuote,
  UserSummary,
} from "./types";

export const currentUser: UserSummary = {
  fullName: "Facundo Rossi",
  accountNumber: "84920-1",
  taxCondition: "Resp. Inscripto",
  verified: true,
};

export const headerTicker: TickerQuote[] = [
  { symbol: "MERVAL", price: 1_842_150, changePct: 2.1 },
  { symbol: "GGAL", price: 4_850, changePct: 3.4 },
  { symbol: "YPFD", price: 28_400, changePct: 1.8 },
  { symbol: "AAPL", price: 18_250 },
];

export const dollarRates: DollarRate[] = [
  { label: "MEP", price: 1_285.4, changePct: 0.4 },
  { label: "CCL", price: 1_310.2, changePct: -0.2 },
];

export const portfolioSummary = {
  totalEquity: 24_850_340,
  totalEquityChangePct: 2.14,
  totalEquityUsd: 19_332.8,
  mepReference: 1_285.4,
  ytdPct: 34.75,
  dayResult: 482_150,
  dayResultPct: 1.98,
  dayVolume: 1_820_000,
  monthResult: 1_840_600,
  monthResultPct: 8.02,
  monthVsMervalPct: 3.4,
  alphaPts: 2.18,
  buyingPower: 3_820_400,
  usdBalance: 1_450,
} as const;

export const performanceStats = [
  { label: "Máximo de período", value: "$25.100.000,00", note: "Alcanzado el 22 Feb", tone: "positive" },
  { label: "Drawdown máximo", value: "-2,40%", note: "Volatilidad controlada", tone: "neutral", valueTone: "negative" },
  { label: "Ratio de Sharpe", value: "1,82", note: "Rendimiento óptimo s/ riesgo", tone: "positive", valueTone: "primary" },
  { label: "Tasa interna (TIR)", value: "+41,2% e.a.", note: "Cartera dolarizada 62%", tone: "neutral" },
] as const;

export const allocation: AllocationSlice[] = [
  { label: "CEDEARs USA", amount: 11_438_000, pct: 46, color: "primary" },
  { label: "Acciones BYMA", amount: 6_958_000, pct: 28, color: "positive" },
  { label: "Bonos & ONs Usd", amount: 3_976_000, pct: 16, color: "primary" },
  { label: "Liquidez ARS/USD", amount: 2_478_340, pct: 10, color: "negative" },
];

export const topMovers: Mover[] = [
  { symbol: "MELI", initials: "ME", name: "MercadoLibre Inc.", tag: "CEDEAR 60:1", tagTone: "neutral", price: 26_700, changePct: 4.2 },
  { symbol: "GGAL", initials: "GG", name: "Grupo Fin. Galicia", tag: "BYMA LÍDER", tagTone: "positive", price: 4_850, changePct: 3.65 },
  { symbol: "NVDA", initials: "NV", name: "Nvidia Corp.", tag: "CEDEAR 24:1", tagTone: "neutral", price: 18_420, changePct: 2.8 },
  { symbol: "TXAR", initials: "TX", name: "Ternium Argentina", tag: "BYMA", tagTone: "neutral", price: 1_120, changePct: -1.32 },
  { symbol: "PAMP", initials: "PA", name: "Pampa Energía S.A.", tag: "BYMA", tagTone: "neutral", price: 2_940, changePct: -0.68 },
];

export const portfolioAssetCount = 14;

export const recentOrders: Order[] = [
  { id: "o-1", symbol: "GGAL", instrument: "Acción", side: "COMPRA", orderType: "Límite · 24hs", quantity: 200, limitPrice: 4_820, currency: "ARS", time: "14:32:10", status: { kind: "executed" } },
  { id: "o-2", symbol: "AAPL", instrument: "CEDEAR", side: "COMPRA", orderType: "Límite · CI", quantity: 50, limitPrice: 18_350, currency: "ARS", time: "12:15:04", status: { kind: "executed" } },
  { id: "o-3", symbol: "AL30D", instrument: "Bono USD", side: "VENTA", orderType: "Límite · 48hs", quantity: 1_000, limitPrice: 58.4, currency: "USD", time: "11:05:22", status: { kind: "partial", filledPct: 60 } },
  { id: "o-4", symbol: "YPFD", instrument: "Acción", side: "COMPRA", orderType: "Stop Límite · 24hs", quantity: 100, limitPrice: 28_300, currency: "ARS", time: "10:48:19", status: { kind: "working" } },
];

export const caucion = { tna: 34.5, availableToPlace: 1_800_000 } as const;

export const staffUser = {
  fullName: "Martín Benítez",
  initials: "MB",
  role: "Oficial de Cumplimiento",
} as const;
