/** Datos de demo del panel staff (back-office del ALyC). */
import { walk } from "./random";

export const adminKpis = {
  activeClients: 14_820,
  activeClientsChangePct: 1.4,
  connectedNow: 4_058,
  newAccountsMonth: 1_248,
  newAccountsToday: 182,
  volumeToday: 842_650_000,
  volumeVsYesterdayPct: 18,
  aucM: 148_420,
  aucTodayM: 1_120,
} as const;

export const registrations = ["05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18"].map((d, i) => ({
  label: d,
  values: [60 + ((i * 37) % 45), 8 + ((i * 13) % 14)],
}));

export const hourlyVolume = {
  labels: ["11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"],
  equities: walk(31, 30, 160, 0.09, 0.01),
  bonds: walk(32, 30, 95, 0.07, 0.005),
};

export type Severity = "critica" | "media" | "baja" | "info";

export interface OpsAlert {
  id: string;
  title: string;
  text: string;
  severity: Severity;
  tag: string;
  action: string;
  href: string;
}

export const opsAlerts: OpsAlert[] = [
  { id: "a1", title: "Órdenes rechazadas: 5 en rueda", text: "Límite de exposición en rueda / saldo fuera de rango. Tickers: GGAL, AL30.", severity: "critica", tag: "Crítica", action: "Ver y auditar", href: "/admin/ordenes" },
  { id: "a2", title: "KYC pendientes de revisión: 12", text: "Cruce PEP y Renaper con alerta. Sin resolución en SLA de 24 hs.", severity: "media", tag: "Esperado", action: "Revisar onboarding (12)", href: "/admin/kyc" },
  { id: "a3", title: "Riesgo de margen / caución: 3", text: "Comitentes con aforo menor al 80% de garantía en cauciones tomadoras.", severity: "media", tag: "Media", action: "Ajustar margen", href: "/admin/riesgo" },
  { id: "a4", title: "Conciliación COELSA pendiente: 4", text: "Transferencias por $4.600.000 ARS pendientes de verificación de CUIT.", severity: "baja", tag: "Tesorería", action: "Liberar fondos", href: "/admin/tesoreria" },
  { id: "a5", title: "Reporte CNV régimen diario", text: "Generado automáticamente · listo para firmar.", severity: "info", tag: "Listo", action: "Firmar", href: "/admin/cumplimiento" },
];

export type ActivityKind = "orden" | "fondos" | "kyc";

export interface DeskEvent {
  time: string;
  client: string;
  account: string;
  kind: ActivityKind;
  action: string;
  detail: string;
  amount: string;
  status: string;
  tone: "positive" | "negative" | "primary" | "neutral";
}

export const deskEvents: DeskEvent[] = [
  { time: "15:43:12", client: "Facundo Rossi", account: "84920-1", kind: "orden", action: "COMPRA", detail: "1.250 GGAL @ $4.890", amount: "$6.112.500", status: "Ejecutada BYMA", tone: "positive" },
  { time: "15:41:05", client: "Lucía Morales", account: "46512-3", kind: "fondos", action: "FONDEO", detail: "Transf. COELSA · Santander", amount: "+$2.500.000", status: "Acreditado T+0", tone: "positive" },
  { time: "15:39:40", client: "Inversiones del Plata S.A.", account: "87811-0", kind: "orden", action: "STOP LOSS", detail: "Bono AL30D venta", amount: "U$S 25.000", status: "Rechazado: margen insuf.", tone: "negative" },
  { time: "15:36:18", client: "Matías Gómez", account: "Alta", kind: "kyc", action: "ONBOARDING", detail: "Validación Renaper nivel 2", amount: "Score 98/100", status: "Verificado auto", tone: "primary" },
  { time: "15:31:02", client: "Tecnitur SRL", account: "31204-8", kind: "fondos", action: "RETIRO", detail: "Retiro bancario en dólares", amount: "-U$S 12.000", status: "En revisión", tone: "neutral" },
];

export type ClientStatus = "activo" | "kyc" | "bloqueado" | "pep";

export interface Client {
  id: string;
  name: string;
  initials: string;
  account: string;
  cuit: string;
  email: string;
  phone: string;
  status: ClientStatus;
  since: string;
  equity: number;
  equityUsd: number;
  risk: "Bajo" | "Medio" | "Alto";
  occupation: string;
  address: string;
  alert?: string;
}

export const clients: Client[] = [
  { id: "c1", name: "Mariano Bustos", initials: "MB", account: "#84921", cuit: "20-31456892-7", email: "mariano.bustos.dev@gmail.com", phone: "+54 9 11 4839-9102", status: "kyc", since: "18/02/2025", equity: 12_500_000, equityUsd: 9_725, risk: "Medio", occupation: "Ingeniero de software (Rel. dependencia)", address: "Av. Santa Fe 3240, 8º B · CABA", alert: "El fondeo inicial supera en 450% el perfil declarado ($2.500.000). Requiere justificación de fondos antes de habilitar." },
  { id: "c2", name: "Lucía Morales", initials: "LM", account: "#46512", cuit: "27-35120841-2", email: "lmorales@fiberbox.com.ar", phone: "+54 9 11 4722-0183", status: "activo", since: "14/02/2025", equity: 12_450_000, equityUsd: 9_690, risk: "Bajo", occupation: "Contadora pública", address: "Olazábal 1820 · CABA" },
  { id: "c3", name: "Inversiones del Plata S.A.", initials: "IP", account: "#87811", cuit: "30-71823652-1", email: "tesoreria@delplata.com", phone: "+54 11 5031-4000", status: "activo", since: "17/02/2025", equity: 84_200_000, equityUsd: 65_500, risk: "Medio", occupation: "Persona jurídica · Agro", address: "Reconquista 620 · CABA" },
  { id: "c4", name: "Facundo Rossi", initials: "FR", account: "#84920", cuit: "20-38492039-4", email: "facu.rossi@icloud.com", phone: "+54 9 11 5555-0000", status: "activo", since: "14/02/2025", equity: 24_850_340, equityUsd: 19_332, risk: "Medio", occupation: "Comerciante", address: "Mitre 455 · Rosario" },
  { id: "c8", name: "Rodrigo Álvarez", initials: "RA", account: "#70231", cuit: "20-29384756-1", email: "ralvarez@gmail.com", phone: "+54 9 341 552-9017", status: "bloqueado", since: "08/02/2025", equity: 2_540_000, equityUsd: 1_975, risk: "Alto", occupation: "Comerciante", address: "Córdoba 1450 · Rosario", alert: "Oficio judicial recibido: medida cautelar sobre saldos." },
  { id: "c5", name: "Gonzalo Varela", initials: "GV", account: "#91038", cuit: "20-28405192-3", email: "gvarela@corriente.gob.ar", phone: "+54 9 379 422-1180", status: "pep", since: "19/02/2025", equity: 18_700_000, equityUsd: 14_550, risk: "Alto", occupation: "Funcionario público (PEP)", address: "Junín 1550 · Corrientes" },
  { id: "c6", name: "Camila Ferreyra", initials: "CF", account: "#77214", cuit: "27-40218736-5", email: "cferreyra@proton.me", phone: "+54 9 351 612-0044", status: "activo", since: "10/02/2025", equity: 3_418_000, equityUsd: 2_660, risk: "Bajo", occupation: "Diseñadora UX", address: "Ituzaingó 870 · Córdoba" },
  { id: "c7", name: "Esteban Quiroga", initials: "EQ", account: "#65102", cuit: "20-33620198-1", email: "equiroga@outlook.com", phone: "+54 9 261 508-7730", status: "activo", since: "12/02/2025", equity: 52_190_000, equityUsd: 40_600, risk: "Medio", occupation: "Productor vitivinícola", address: "San Martín 1200 · Mendoza" },
];

export type TreasuryKind = "RETIRO" | "DEPÓSITO";

export interface TreasuryItem {
  id: string;
  kind: TreasuryKind;
  client: string;
  account: string;
  amount: number;
  currency: "ARS" | "USD";
  bank: string;
  cuitMatch: boolean;
  risk: string;
  observed?: boolean;
  vip?: boolean;
  /** Retiro pedido por el inversor de la demo: al resolverlo se actualiza su movimiento. */
  movementId?: string;
}

export const treasuryQueue: TreasuryItem[] = [
  { id: "TRX-98241", kind: "RETIRO", client: "Mariano Bustos", account: "84921", amount: 12_500_000, currency: "ARS", bank: "Banco Galicia · CBU ***9102", cuitMatch: true, risk: "SLA 12m" },
  { id: "TRX-98239", kind: "DEPÓSITO", client: "Inversiones del Plata S.A.", account: "87811", amount: 35_000, currency: "USD", bank: "BBVA Francés · cuenta de 3ro", cuitMatch: false, risk: "Alerta PLA", observed: true, vip: true },
  { id: "TRX-98236", kind: "RETIRO", client: "Rodrigo Álvarez", account: "70231", amount: 3_200_000, currency: "ARS", bank: "Banco Santander · CBU ***3312", cuitMatch: true, risk: "Cautelar", observed: true },
  { id: "TRX-98230", kind: "RETIRO", client: "Agropecuaria El Ombú", account: "55410", amount: 24_000_000, currency: "ARS", bank: "Banco Macro · Interbanking", cuitMatch: false, risk: "CUIT ≠", observed: true, vip: true },
  { id: "TRX-98228", kind: "RETIRO", client: "Carla Méndez", account: "71020", amount: 450_000, currency: "ARS", bank: "Mercado Pago · CVU ***8841", cuitMatch: true, risk: "SLA 3m" },
];

export const treasuryLog = [
  { time: "15:46:12", operator: "Bot STP COELSA", op: "Depósito automático · Juan P. Suárez", amount: "+$850.000,00", ref: "COELSA-9921", status: "Acreditado T+0" },
  { time: "15:44:03", operator: "Martín Benítez", op: "Retiro transferido · Lucía Morales", amount: "-$4.800.000,00", ref: "INTERBANK-7719", status: "Transferido" },
  { time: "15:42:19", operator: "Mesa Compliance", op: "Depósito rechazado · Gastón Lemos (3ro)", amount: "$2.500.000,00", ref: "REJ-CUIT-2201", status: "Rechazado" },
  { time: "15:38:44", operator: "Bot STP COELSA", op: "Acreditación automática · Lucía Fernández", amount: "+$1.200.000,00", ref: "COELSA-9906", status: "Acreditado T+0" },
];

export const plaAlerts = [
  {
    id: "p1",
    level: "Crítica · Pre-ROS",
    tone: "negative" as const,
    subject: "Agroinversiones Pampeanas S.A.",
    ref: "Cta. #11045 · CUIT 30-71882041-9",
    text: "Depósito de USD 480.000 en efectivo vía transferencia desde cuenta de tercero. Excede en 5,8x el perfil transaccional declarado.",
    actions: ["Archivar / Dictamen", "Solicitar justificación", "Emitir ROS"],
  },
  {
    id: "p2",
    level: "Media · PEP",
    tone: "primary" as const,
    subject: "Dr. Fernando Morales",
    ref: "Cta. #44820 · CUIT 20-24190566-1",
    text: "Ingresos de USD 85.000 por mandato de administración de cartera. Requiere actualización de declaración jurada PEP.",
    actions: ["Ver legajo PEP", "Solicitar justificación"],
  },
  {
    id: "p3",
    level: "Fraccionamiento",
    tone: "neutral" as const,
    subject: "Lucas Benjamín Peralta",
    ref: "Cta. #78210 · CUIT 20-41022987-6",
    text: "7 depósitos por debajo del umbral de reporte en 48 hs desde billeteras virtuales distintas (posible estructuración).",
    actions: ["Auditar billeteras", "Desbloquear"],
  },
];

export const riskMatrix = { bajo: 72, medio: 20, alto: 6, inaceptable: 2 };

export const docExpirations = [
  { who: "Inversiones del Plata S.A.", what: "Balance contable 2024 y actas de directorio", due: "Vence en 5 días", critical: true },
  { who: "Mariano Bustos", what: "Justificación de fondos (recibo de sueldo / DDJJ)", due: "Vence hoy", critical: true },
  { who: "Gonzalo Varela", what: "Declaración jurada PEP anual", due: "Vence en 12 días", critical: false },
  { who: "Tecnitur SRL", what: "Constancia de inscripción AFIP actualizada", due: "Vence en 20 días", critical: false },
];

export const auditLog = [
  { ts: "15:42:10", who: "Martín Benítez", role: "Compliance", action: "Modificación de límite operativo", ref: "Cta. #84921", detail: "Baja de límite de fondeo a $2.500.000 hasta justificar origen.", hash: "0x8f3a…c21d" },
  { ts: "15:30:02", who: "Bot COELSA", role: "Sistema", action: "Conciliación automática", ref: "Lote #1182", detail: "1.184 acreditaciones conciliadas sin intervención.", hash: "0x1be9…77fa" },
  { ts: "15:12:48", who: "Laura Vega", role: "Tesorería", action: "Rechazo de retiro", ref: "TRX-98110", detail: "CUIT destino no coincide con titular.", hash: "0x4c02…9a1e" },
  { ts: "14:55:31", who: "Sistema PLA", role: "Motor de reglas", action: "Alerta de fraccionamiento", ref: "Cta. #78210", detail: "Regla R-07: 7 depósitos < umbral en 48 hs.", hash: "0xa771…03bc" },
  { ts: "14:20:05", who: "Martín Benítez", role: "Compliance", action: "Notificación de vencimiento", ref: "Batch #22", detail: "Intimación automática a 14 comitentes con documentación vencida.", hash: "0x93d0…e4f2" },
];

export type AdminOrderStatus = "working" | "partial" | "executed" | "cancelled" | "rejected";

export interface AdminOrder {
  id: string;
  time: string;
  client: string;
  account: string;
  channel: "Web" | "App" | "API" | "Mesa";
  symbol: string;
  side: "buy" | "sell";
  type: string;
  quantity: number;
  filled: number;
  price: number;
  currency: "ARS" | "USD";
  status: AdminOrderStatus;
  reason?: string;
}

/** Órdenes de otros comitentes (las del inversor de la demo se suman en vivo desde su cuenta). */
export const deskOrders: AdminOrder[] = [
  { id: "NYM-92977", time: "15:43:12", client: "Lucía Morales", account: "46512-3", channel: "App", symbol: "GGAL", side: "buy", type: "Límite", quantity: 1_250, filled: 1_250, price: 4_890, currency: "ARS", status: "executed" },
  { id: "NYM-92975", time: "15:41:40", client: "Inversiones del Plata S.A.", account: "87811-0", channel: "API", symbol: "AL30D", side: "sell", type: "Stop Límite", quantity: 25_000, filled: 0, price: 57.9, currency: "USD", status: "rejected", reason: "Margen insuficiente" },
  { id: "NYM-92971", time: "15:39:02", client: "Esteban Quiroga", account: "65102-7", channel: "Web", symbol: "YPFD", side: "buy", type: "Límite", quantity: 400, filled: 150, price: 28_300, currency: "ARS", status: "partial" },
  { id: "NYM-92966", time: "15:35:47", client: "Camila Ferreyra", account: "77214-0", channel: "App", symbol: "MELI", side: "buy", type: "Mercado", quantity: 12, filled: 12, price: 26_710, currency: "ARS", status: "executed" },
  { id: "NYM-92960", time: "15:30:15", client: "Agropecuaria El Ombú", account: "55410-2", channel: "Mesa", symbol: "GD30D", side: "buy", type: "Límite", quantity: 50_000, filled: 0, price: 59.8, currency: "USD", status: "working" },
  { id: "NYM-92955", time: "15:22:09", client: "Mariano Bustos", account: "84921-9", channel: "Web", symbol: "NVDA", side: "buy", type: "Límite", quantity: 300, filled: 0, price: 18_100, currency: "ARS", status: "rejected", reason: "Cuenta con KYC pendiente" },
  { id: "NYM-92948", time: "15:10:33", client: "Tecnitur SRL", account: "31204-8", channel: "API", symbol: "PAMP", side: "sell", type: "Límite", quantity: 2_000, filled: 0, price: 2_980, currency: "ARS", status: "working" },
  { id: "NYM-92941", time: "14:58:50", client: "Gonzalo Varela", account: "91038-4", channel: "Web", symbol: "AAPL", side: "buy", type: "Límite", quantity: 100, filled: 0, price: 18_900, currency: "ARS", status: "rejected", reason: "Límite de exposición PEP" },
  { id: "NYM-92933", time: "14:41:18", client: "Lucía Morales", account: "46512-3", channel: "App", symbol: "BMA", side: "sell", type: "Límite", quantity: 500, filled: 500, price: 7_180, currency: "ARS", status: "executed" },
  { id: "NYM-92920", time: "14:20:05", client: "Esteban Quiroga", account: "65102-7", channel: "Mesa", symbol: "TXAR", side: "sell", type: "Límite", quantity: 3_000, filled: 0, price: 1_150, currency: "ARS", status: "cancelled" },
  { id: "NYM-92914", time: "14:02:44", client: "Inversiones del Plata S.A.", account: "87811-0", channel: "API", symbol: "GGAL", side: "sell", type: "Límite", quantity: 8_000, filled: 0, price: 5_200, currency: "ARS", status: "rejected", reason: "Fuera de banda de precios" },
  { id: "NYM-92902", time: "13:47:21", client: "Camila Ferreyra", account: "77214-0", channel: "App", symbol: "KO", side: "buy", type: "Límite", quantity: 40, filled: 0, price: 14_050, currency: "ARS", status: "rejected", reason: "Saldo insuficiente" },
];

export interface RiskLimit {
  clientId: string;
  /** Límite de exposición en rueda (ARS). */
  exposureLimit: number;
  /** Uso actual del límite (ARS). */
  used: number;
  /** Aforo de garantía en cauciones tomadoras (%). */
  collateral: number;
  leverage: boolean;
}

export const riskLimits: RiskLimit[] = [
  { clientId: "c1", exposureLimit: 2_500_000, used: 1_980_000, collateral: 100, leverage: false },
  { clientId: "c2", exposureLimit: 15_000_000, used: 6_200_000, collateral: 92, leverage: true },
  { clientId: "c3", exposureLimit: 120_000_000, used: 98_400_000, collateral: 74, leverage: true },
  { clientId: "c4", exposureLimit: 30_000_000, used: 20_600_000, collateral: 100, leverage: false },
  { clientId: "c8", exposureLimit: 0, used: 0, collateral: 100, leverage: false },
  { clientId: "c5", exposureLimit: 10_000_000, used: 9_100_000, collateral: 81, leverage: false },
  { clientId: "c6", exposureLimit: 5_000_000, used: 1_200_000, collateral: 100, leverage: false },
  { clientId: "c7", exposureLimit: 60_000_000, used: 47_300_000, collateral: 77, leverage: true },
];

export const staffRoles = ["Administrador", "Compliance", "Tesorería", "Mesa de operaciones", "Soporte"] as const;
export const permissions = [
  "Aprobar KYC",
  "Bloquear comitentes",
  "Aprobar retiros",
  "Cancelar órdenes de clientes",
  "Modificar límites de riesgo",
  "Emitir ROS a UIF",
  "Responder tickets",
  "Exportar reportes regulatorios",
] as const;

/** Matriz inicial rol × permiso. */
export const roleMatrix: Record<string, string[]> = {
  Administrador: [...permissions],
  Compliance: ["Aprobar KYC", "Bloquear comitentes", "Emitir ROS a UIF", "Exportar reportes regulatorios", "Modificar límites de riesgo"],
  Tesorería: ["Aprobar retiros", "Exportar reportes regulatorios"],
  "Mesa de operaciones": ["Cancelar órdenes de clientes", "Modificar límites de riesgo"],
  Soporte: ["Responder tickets"],
};

export const staffMembers = [
  { name: "Martín Benítez", role: "Compliance", email: "mbenitez@nodo.com.ar", lastSeen: "Ahora" },
  { name: "Laura Vega", role: "Tesorería", email: "lvega@nodo.com.ar", lastSeen: "Hace 12 min" },
  { name: "Diego Paz", role: "Mesa de operaciones", email: "dpaz@nodo.com.ar", lastSeen: "Hace 3 min" },
  { name: "Sofía Ríos", role: "Soporte", email: "srios@nodo.com.ar", lastSeen: "Hace 1 h" },
  { name: "Ana Torres", role: "Administrador", email: "atorres@nodo.com.ar", lastSeen: "Ayer" },
];
