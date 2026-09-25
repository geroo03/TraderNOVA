export type Currency = "ARS" | "USD";

export type InstrumentType = "Acción" | "CEDEAR" | "Bono USD";

export interface TickerQuote {
  symbol: string;
  price: number;
  changePct?: number;
}

export interface DollarRate {
  label: "MEP" | "CCL";
  price: number;
  changePct: number;
}

export interface AllocationSlice {
  label: string;
  amount: number;
  pct: number;
  /** Must match the slice colour in public/figma/donut-allocation.svg. */
  color: "primary" | "positive" | "negative";
}

export interface Mover {
  symbol: string;
  initials: string;
  name: string;
  tag: string;
  tagTone: "neutral" | "positive";
  price: number;
  changePct: number;
}

export type OrderSide = "COMPRA" | "VENTA";

export type OrderStatus =
  | { kind: "executed" }
  | { kind: "partial"; filledPct: number }
  | { kind: "working" };

export interface Order {
  id: string;
  symbol: string;
  instrument: InstrumentType;
  side: OrderSide;
  orderType: string;
  quantity: number;
  limitPrice: number;
  currency: Currency;
  time: string;
  status: OrderStatus;
}

export interface UserSummary {
  fullName: string;
  accountNumber: string;
  taxCondition: string;
  verified: boolean;
}
