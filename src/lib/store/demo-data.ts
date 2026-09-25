/**
 * Semillas y claves del estado persistente de la demo. Todo lo que el usuario (o el staff)
 * modifica arranca de estos valores y se guarda en localStorage (ver local-store.ts).
 */
import { movements as historicMovements } from "../accounts";
import { orderValue } from "../orders";
import { holdings } from "../portfolio";
import { accountBalances } from "../portfolio";
import type { AccountBase, LiveOrder, Movement } from "../trading";

export const KEYS = {
  orders: "orders",
  movements: "movements",
  simMode: "sim-mode",
  notifications: "notifications",
  watchlist: "watchlist",
  linkedAccounts: "linked-accounts",
  journalNotes: "journal-notes",
  settings: "settings",
  tickets: "tickets",
  audit: "audit",
  clients: "clients",
  riskLimits: "risk-limits",
  roles: "roles",
  treasury: "treasury",
  drawings: "drawings",
  alerts: "price-alerts",
  account: "account",
} as const;

/**
 * Cuenta activa en el navegador: la de ejemplo (Facundo Rossi, con cartera) o una abierta desde
 * el onboarding, que arranca vacía y pendiente de KYC.
 */
export type InvestorAccount =
  | { kind: "demo" }
  | { kind: "new"; accountNumber: string; cuit: string; createdAt: number; autoApproved?: boolean; welcomeDismissed?: boolean };

export const DEMO_ACCOUNT: InvestorAccount = { kind: "demo" };
export const DEMO_IDENTITY = { accountNumber: "84920-1", cuit: "20-38492039-4" } as const;
/** Una cuenta nueva no tiene saldo ni tenencia: hay que ingresar dinero para operar. */
export const EMPTY_BASE: AccountBase = { ars: 0, usd: 0, positions: {} };
/** La validación automática (Renaper + listas UIF) aprueba el legajo a los pocos segundos. */
export const AUTO_APPROVAL_MS = 20_000;

export interface PriceAlert {
  id: string;
  symbol: string;
  /** Se dispara cuando el precio cruza el nivel en esta dirección. */
  direction: "above" | "below";
  price: number;
  active: boolean;
  triggeredAt?: string;
}

export const SEED_ORDERS: LiveOrder[] = [
  { id: "NYM-92841", time: "14:32:10", symbol: "GGAL", side: "buy", type: "Límite", term: "24hs", quantity: 200, filled: 0, price: 4_820, status: "working", currency: "ARS" },
  { id: "NYM-92790", time: "12:40:02", symbol: "AL30D", side: "sell", type: "Límite", term: "48hs", quantity: 1_000, filled: 600, price: 58.6, status: "partial", currency: "USD", settledQty: 600 },
  { id: "NYM-92702", time: "12:15:04", symbol: "AAPL", side: "buy", type: "Límite", term: "CI", quantity: 50, filled: 50, price: 18_350, status: "executed", currency: "ARS", settledQty: 50 },
  { id: "NYM-92655", time: "11:48:31", symbol: "MELI", side: "buy", type: "Mercado", term: "24hs", quantity: 20, filled: 20, price: 26_690, status: "executed", currency: "ARS", settledQty: 20 },
  { id: "NYM-92610", time: "11:05:22", symbol: "TXAR", side: "sell", type: "Límite", term: "24hs", quantity: 800, filled: 0, price: 1_150, status: "cancelled", currency: "ARS" },
  { id: "NYM-92588", time: "10:48:19", symbol: "YPFD", side: "buy", type: "Stop Límite", term: "24hs", quantity: 100, filled: 100, price: 28_300, status: "executed", currency: "ARS", settledQty: 100 },
];

// El saldo base suma lo que reserva la compra abierta de la semilla, así el "disponible"
// inicial coincide con el del Figma ($3.820.400).
const seedReserve = orderValue("GGAL", 200, 4_820, "buy").total;

export const REAL_BASE: AccountBase = {
  ars: accountBalances.arsAvailable + seedReserve,
  usd: accountBalances.usdAvailable,
  positions: Object.fromEntries(holdings.map((h) => [h.symbol, { qty: h.quantity, avgPrice: h.avgPrice }])),
};

export const SIM_START_ARS = 10_000_000;
export const SIM_START_USD = 10_000;
export const SIM_BASE: AccountBase = { ars: SIM_START_ARS, usd: SIM_START_USD, positions: {} };

export const SEED_MOVEMENTS: Movement[] = historicMovements.map((m) => ({ ...m, historic: true }));

export interface DemoNotification {
  id: string;
  title: string;
  text: string;
  time: string;
  read: boolean;
  tone: "positive" | "negative" | "primary" | "neutral";
  href?: string;
}

export const SEED_NOTIFICATIONS: DemoNotification[] = [
  { id: "n1", title: "Dividendo acreditado", text: "Cobraste U$S 18,50 de AAPL en tu cuenta en dólares.", time: "09:12", read: false, tone: "positive", href: "/cuentas" },
  { id: "n2", title: "Orden parcialmente ejecutada", text: "AL30D: 600 de 1.000 nominales vendidos a U$S 58,60.", time: "12:40", read: false, tone: "primary", href: "/ordenes" },
  { id: "n3", title: "Nuevo informe disponible", text: "Tu resumen fiscal de enero ya está listo para descargar.", time: "Ayer", read: true, tone: "neutral", href: "/informes" },
];

export const DEFAULT_WATCHLIST = ["GGAL", "YPFD", "BMA", "ALUA", "EDN", "AAPL", "MELI"];

export interface DemoSettings {
  theme: "dark" | "light";
  currency: "ARS" | "USD";
  confirmOrders: boolean;
  profile: { fullName: string; email: string; phone: string; address: string };
  twoFactor: boolean;
  notify: { fills: boolean; deposits: boolean; news: boolean; priceAlerts: boolean; channelEmail: boolean; channelWhatsapp: boolean; channelPush: boolean };
  riskProfile: "Conservador" | "Moderado" | "Agresivo" | null;
  /** "real": respeta el horario de BYMA; "always": rueda abierta siempre (para demostraciones). */
  sessionMode: "real" | "always";
}

export const DEFAULT_SETTINGS: DemoSettings = {
  theme: "dark",
  currency: "ARS",
  confirmOrders: true,
  profile: { fullName: "Facundo Rossi", email: "facu.rossi@icloud.com", phone: "+54 9 11 5555-0000", address: "Mitre 455 · Rosario" },
  twoFactor: true,
  notify: { fills: true, deposits: true, news: false, priceAlerts: true, channelEmail: true, channelWhatsapp: true, channelPush: false },
  riskProfile: "Moderado",
  sessionMode: "real",
};

export type TicketStatus = "Abierto" | "En curso" | "Resuelto";

export interface TicketMessage {
  from: "cliente" | "staff" | "bot";
  author: string;
  text: string;
  time: string;
}

export interface Ticket {
  id: string;
  subject: string;
  category: string;
  priority: "Baja" | "Media" | "Alta";
  status: TicketStatus;
  client: string;
  account: string;
  createdAt: string;
  messages: TicketMessage[];
}

export const SEED_TICKETS: Ticket[] = [
  {
    id: "TK-2041",
    subject: "No veo acreditada mi transferencia",
    category: "Fondos",
    priority: "Alta",
    status: "Abierto",
    client: "Lucía Morales",
    account: "46512-3",
    createdAt: "Hoy 15:02",
    messages: [{ from: "cliente", author: "Lucía Morales", text: "Transferí $2.500.000 desde Santander hace 20 minutos y todavía no lo veo.", time: "15:02" }],
  },
  {
    id: "TK-2038",
    subject: "Consulta por comisión de CEDEARs",
    category: "Operatoria",
    priority: "Baja",
    status: "En curso",
    client: "Camila Ferreyra",
    account: "77214-0",
    createdAt: "Hoy 11:40",
    messages: [
      { from: "cliente", author: "Camila Ferreyra", text: "¿La comisión de 0,15% aplica también a CEDEARs?", time: "11:40" },
      { from: "staff", author: "Mesa de ayuda", text: "Sí, es la misma para acciones y CEDEARs. Los bonos tienen 0,10%.", time: "11:52" },
    ],
  },
  {
    id: "TK-2031",
    subject: "Cambio de cuenta bancaria predeterminada",
    category: "Cuenta",
    priority: "Media",
    status: "Resuelto",
    client: "Esteban Quiroga",
    account: "65102-7",
    createdAt: "Ayer 17:15",
    messages: [
      { from: "cliente", author: "Esteban Quiroga", text: "Quiero que los retiros vayan a mi cuenta del Banco Nación.", time: "17:15" },
      { from: "staff", author: "Mesa de ayuda", text: "Listo, quedó como predeterminada.", time: "17:40" },
    ],
  },
];

export interface AuditEntry {
  ts: string;
  who: string;
  role: string;
  action: string;
  ref: string;
  detail: string;
  hash: string;
}
