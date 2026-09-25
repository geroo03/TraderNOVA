/** Universo de instrumentos de demo, compartido por Cotizaciones, Mercados, Operar y Terminal. */
import { candles, walk } from "./random";
import type { Ohlc } from "./chart-math";

export type Board = "Panel Líder" | "CEDEAR" | "Bono";

export interface Instrument {
  symbol: string;
  name: string;
  board: Board;
  sector: string;
  price: number;
  changePct: number;
  /** Volumen operado en millones de ARS. */
  volumeM: number;
  currency: "ARS" | "USD";
  /** Ratio de conversión, solo CEDEARs. */
  ratio?: string;
}

export const instruments: Instrument[] = [
  { symbol: "GGAL", name: "Grupo Financiero Galicia S.A.", board: "Panel Líder", sector: "Financiero", price: 4_850, changePct: 3.65, volumeM: 3_420.5, currency: "ARS" },
  { symbol: "YPFD", name: "YPF S.A.", board: "Panel Líder", sector: "Energía & Petróleo", price: 28_450, changePct: 1.82, volumeM: 2_893.2, currency: "ARS" },
  { symbol: "PAMP", name: "Pampa Energía S.A.", board: "Panel Líder", sector: "Utilities", price: 2_940, changePct: -0.68, volumeM: 1_540.8, currency: "ARS" },
  { symbol: "BMA", name: "Banco Macro S.A.", board: "Panel Líder", sector: "Financiero", price: 7_150, changePct: 1.2, volumeM: 1_126.4, currency: "ARS" },
  { symbol: "TXAR", name: "Ternium Argentina S.A.", board: "Panel Líder", sector: "Materiales", price: 1_120, changePct: -1.32, volumeM: 968.1, currency: "ARS" },
  { symbol: "ALUA", name: "Aluar Aluminio Argentino", board: "Panel Líder", sector: "Materiales", price: 985, changePct: 0.45, volumeM: 748.3, currency: "ARS" },
  { symbol: "CRES", name: "Cresud S.A.", board: "Panel Líder", sector: "Agro", price: 1_340, changePct: 1.15, volumeM: 620.9, currency: "ARS" },
  { symbol: "BYMA", name: "Bolsas y Mercados Argentinos", board: "Panel Líder", sector: "Financiero", price: 1_480, changePct: -0.23, volumeM: 588.2, currency: "ARS" },
  { symbol: "EDN", name: "Edenor S.A.", board: "Panel Líder", sector: "Utilities", price: 1_290, changePct: 4.15, volumeM: 812.5, currency: "ARS" },
  { symbol: "TGSU2", name: "Transportadora de Gas del Sur", board: "Panel Líder", sector: "Energía & Petróleo", price: 6_180, changePct: 1.85, volumeM: 704.7, currency: "ARS" },
  { symbol: "AAPL", name: "Apple Inc.", board: "CEDEAR", sector: "Tecnología", price: 18_350, changePct: 1.15, volumeM: 1_840.2, currency: "ARS", ratio: "10:1" },
  { symbol: "MSFT", name: "Microsoft Corp.", board: "CEDEAR", sector: "Software / Cloud", price: 15_820, changePct: 0.45, volumeM: 1_210.6, currency: "ARS", ratio: "30:1" },
  { symbol: "MELI", name: "MercadoLibre Inc.", board: "CEDEAR", sector: "E-commerce", price: 26_700, changePct: 4.2, volumeM: 2_104.9, currency: "ARS", ratio: "60:1" },
  { symbol: "NVDA", name: "Nvidia Corp.", board: "CEDEAR", sector: "Semiconductores", price: 18_420, changePct: 2.8, volumeM: 1_977.3, currency: "ARS", ratio: "24:1" },
  { symbol: "KO", name: "Coca-Cola Co.", board: "CEDEAR", sector: "Consumo", price: 14_210, changePct: -0.35, volumeM: 402.1, currency: "ARS", ratio: "5:1" },
  { symbol: "AL30D", name: "Bonar 2030 (USD)", board: "Bono", sector: "Soberano", price: 58.4, changePct: 1.4, volumeM: 5_620.4, currency: "USD" },
  { symbol: "GD30D", name: "Global 2030 (USD)", board: "Bono", sector: "Soberano", price: 60.15, changePct: 1.1, volumeM: 4_104.7, currency: "USD" },
  { symbol: "GD35D", name: "Global 2035 (USD)", board: "Bono", sector: "Soberano", price: 54.9, changePct: 0.85, volumeM: 1_890.3, currency: "USD" },
  { symbol: "YMCIO", name: "ON YPF 2026 (USD)", board: "Bono", sector: "Corporativo", price: 101.2, changePct: 0.12, volumeM: 310.6, currency: "USD" },
];

export function findInstrument(symbol: string): Instrument | undefined {
  return instruments.find((i) => i.symbol.toLowerCase() === symbol.toLowerCase());
}

/** Semilla estable por símbolo para que cada activo tenga "su" gráfico. */
function seedOf(symbol: string): number {
  return [...symbol].reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7);
}

export function intradaySeries(symbol: string, last: number, points = 40): number[] {
  return walk(seedOf(symbol), points, last, 0.008, 0.0008);
}

export function priceCandles(symbol: string, last: number, count = 60): Ohlc[] {
  return candles(seedOf(symbol), count, last);
}

export interface BookLevel {
  price: number;
  qty: number;
  total: number;
}

/** Libro de órdenes nivel 2 alrededor del precio, con tick de 0,1%. */
export function orderBook(symbol: string, price: number, levels = 5): { bids: BookLevel[]; asks: BookLevel[]; spread: number } {
  const tick = Math.max(0.05, Math.round(price * 0.001 * 100) / 100);
  const qty = (i: number, side: number) => 300 + ((seedOf(symbol) * (i + 3) * side) % 4200);
  let acc = 0;
  const asks = Array.from({ length: levels }, (_, i) => {
    const q = qty(i, 3);
    acc += q;
    return { price: price + tick * (i + 1), qty: q, total: acc };
  }).reverse();
  acc = 0;
  const bids = Array.from({ length: levels }, (_, i) => {
    const q = qty(i, 5);
    acc += q;
    return { price: price - tick * i, qty: q, total: acc };
  });
  return { bids, asks, spread: tick };
}

export const marketIndices = [
  { label: "S&P Merval", value: 1_845_320.15, changePct: 2.34 },
  { label: "Riesgo País", value: 1_180, changePct: -1.8, unit: "bps" },
  { label: "Dólar MEP", value: 1_284.5, changePct: 0.42 },
  { label: "Dólar CCL", value: 1_312.8, changePct: -0.15 },
] as const;

export interface Execution {
  time: string;
  qty: number;
  price: number;
  side: "buy" | "sell";
}

export const tape: Execution[] = [
  { time: "15:42:19", qty: 350, price: 4_850, side: "buy" },
  { time: "15:42:02", qty: 120, price: 4_849.5, side: "sell" },
  { time: "15:41:48", qty: 900, price: 4_850, side: "buy" },
  { time: "15:41:35", qty: 1_500, price: 4_849, side: "sell" },
  { time: "15:41:20", qty: 200, price: 4_850.5, side: "buy" },
  { time: "15:40:58", qty: 640, price: 4_851, side: "buy" },
];
