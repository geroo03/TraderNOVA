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
  { id: "c4", name: "Facundo Rossi", initials: "FR", account: "#84920", cuit: "20-38492039-4", email: "facu.rossi@icloud.com", phone: "+54 9 11 5555-0000", status: "bloqueado", since: "14/02/2025", equity: 2_540_000, equityUsd: 1_975, risk: "Alto", occupation: "Comerciante", address: "Mitre 455 · Rosario", alert: "Oficio judicial recibido: medida cautelar sobre saldos." },
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
}

export const treasuryQueue: TreasuryItem[] = [
  { id: "TRX-98241", kind: "RETIRO", client: "Mariano Bustos", account: "84921", amount: 12_500_000, currency: "ARS", bank: "Banco Galicia · CBU ***9102", cuitMatch: true, risk: "SLA 12m" },
  { id: "TRX-98239", kind: "DEPÓSITO", client: "Inversiones del Plata S.A.", account: "87811", amount: 35_000, currency: "USD", bank: "BBVA Francés · cuenta de 3ro", cuitMatch: false, risk: "Alerta PLA", observed: true, vip: true },
  { id: "TRX-98236", kind: "RETIRO", client: "Facundo Rossi", account: "84920", amount: 3_200_000, currency: "ARS", bank: "Banco Santander · CBU ***3312", cuitMatch: true, risk: "Cautelar", observed: true },
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
