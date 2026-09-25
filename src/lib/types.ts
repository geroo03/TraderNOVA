export type Currency = "ARS" | "USD";

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

export interface UserSummary {
  fullName: string;
  accountNumber: string;
  taxCondition: string;
  verified: boolean;
}
