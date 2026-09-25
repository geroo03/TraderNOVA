/**
 * Datos de ejemplo tomados del Figma. Cuando exista backend, reemplazar este
 * módulo por llamadas a la API manteniendo los mismos tipos de `./types`.
 */
import type { DollarRate, TickerQuote, UserSummary } from "./types";

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

/** Volumen operado hoy antes de la sesión de la demo (el del Figma); se le suma lo que se ejecute. */
export const portfolioSummary = {
  dayVolume: 1_820_000,
} as const;

export const caucion = { tna: 34.5, availableToPlace: 1_800_000 } as const;

export const staffUser = {
  fullName: "Martín Benítez",
  initials: "MB",
  role: "Oficial de Cumplimiento",
} as const;
