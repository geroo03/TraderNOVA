export interface LinkedAccount {
  id: string;
  bank: string;
  initials: string;
  type: string;
  currency: "ARS" | "USD";
  last4: string;
  alias: string;
  isDefault?: boolean;
}

export const linkedAccounts: LinkedAccount[] = [
  { id: "galicia", bank: "Banco Galicia", initials: "G", type: "Caja de Ahorro", currency: "ARS", last4: "9182", alias: "facundo.rossi.galicia", isDefault: true },
  { id: "bbva", bank: "BBVA Argentina", initials: "BB", type: "Caja de Ahorro", currency: "USD", last4: "4421", alias: "facundo.rossi.bbva" },
];

export const depositDetails = {
  bank: "Banco Industrial (BIND)",
  accountType: "Cta. Corriente Especial en Pesos",
  cbu: "3220001905000492817201",
  alias: "NODO.BROKER.DEPO",
  holder: "NODO BROKER S.A.",
  cuit: "30-71638541-9",
} as const;

export type MovementKind = "deposit" | "withdrawal" | "mep" | "income";

export interface Movement {
  id: string;
  date: string;
  kind: MovementKind;
  title: string;
  reference: string;
  counterparty: string;
  amount: number;
  currency: "ARS" | "USD";
  status: "Acreditado" | "Liquidado T+1" | "En proceso";
}

export const movements: Movement[] = [
  { id: "m1", date: "Hoy, 14:20 hs", kind: "deposit", title: "Depósito bancario inmediato", reference: "ID: MOV-849201", counterparty: "Banco Galicia - CA · Titular: Facundo Rossi", amount: 500_000, currency: "ARS", status: "Acreditado" },
  { id: "m2", date: "Ayer, 11:05 hs", kind: "withdrawal", title: "Retiro a cuenta bancaria", reference: "ID: MOV-849102", counterparty: "Banco Galicia - CA · CBU ***9182", amount: -150_000, currency: "ARS", status: "Acreditado" },
  { id: "m3", date: "18 Feb 2025, 16:40", kind: "mep", title: "Liquidación dólar MEP (AL30)", reference: "ID: MOV-848771", counterparty: "Custodia Caja de Valores · Boleto 92841", amount: 350, currency: "USD", status: "Liquidado T+1" },
  { id: "m4", date: "14 Feb 2025, 10:15", kind: "income", title: "Cobro cupón de intereses (AL30D)", reference: "ID: MOV-848320", counterparty: "Renta Bonar 2030 · Amortización", amount: 48.2, currency: "USD", status: "Acreditado" },
  { id: "m5", date: "12 Feb 2025, 09:30", kind: "deposit", title: "Depósito CVU Mercado Pago", reference: "ID: MOV-847915", counterparty: "Mercado Pago · CVU ***4410", amount: 320_000, currency: "ARS", status: "Acreditado" },
  { id: "m6", date: "10 Feb 2025, 17:02", kind: "withdrawal", title: "Retiro a cuenta en dólares", reference: "ID: MOV-847610", counterparty: "BBVA Argentina - CA USD ***4421", amount: -500, currency: "USD", status: "En proceso" },
];
