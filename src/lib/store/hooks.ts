"use client";

/** Accesos tipados al estado persistente compartido por inversor y staff. */
import { useMemo } from "react";
import { getStore, useLocalStore, writeStore } from "./local-store";
import {
  AUTO_APPROVAL_MS,
  DEFAULT_SETTINGS,
  DEMO_ACCOUNT,
  DEMO_IDENTITY,
  DEFAULT_WATCHLIST,
  KEYS,
  SEED_MOVEMENTS,
  SEED_NOTIFICATIONS,
  SEED_ORDERS,
  SEED_TICKETS,
  type AuditEntry,
  type DemoNotification,
  type DemoSettings,
  type InvestorAccount,
  type PriceAlert,
  type Ticket,
} from "./demo-data";
import { linkedAccounts as SEED_LINKED, type LinkedAccount } from "../accounts";
import { auditLog as SEED_AUDIT, clients as SEED_CLIENTS, treasuryLog, treasuryQueue, type Client, type TreasuryItem } from "../admin-data";
import { currentUser } from "../mock-data";
import type { LiveOrder, Movement } from "../trading";
import { newId, nowTime } from "../download";

export const useOrdersStore = () => useLocalStore<LiveOrder[]>(KEYS.orders, SEED_ORDERS);
export const useMovementsStore = () => useLocalStore<Movement[]>(KEYS.movements, SEED_MOVEMENTS);
export const useSimModeStore = () => useLocalStore<boolean>(KEYS.simMode, false);
export const useNotificationsStore = () => useLocalStore<DemoNotification[]>(KEYS.notifications, SEED_NOTIFICATIONS);
export const useWatchlistStore = () => useLocalStore<string[]>(KEYS.watchlist, DEFAULT_WATCHLIST);
export const useLinkedAccountsStore = () => useLocalStore<LinkedAccount[]>(KEYS.linkedAccounts, SEED_LINKED);
/** Ajustes guardados completados con los valores por defecto (por si se agregan campos nuevos). */
export function useSettingsStore() {
  const [stored, set] = useLocalStore<DemoSettings>(KEYS.settings, DEFAULT_SETTINGS);
  const settings = useMemo(() => ({ ...DEFAULT_SETTINGS, ...stored }), [stored]);
  return [settings, set] as const;
}
export const useTicketsStore = () => useLocalStore<Ticket[]>(KEYS.tickets, SEED_TICKETS);
export const useAuditStore = () => useLocalStore<AuditEntry[]>(KEYS.audit, SEED_AUDIT);
const NO_ALERTS: PriceAlert[] = [];
export const useAlertsStore = () => useLocalStore<PriceAlert[]>(KEYS.alerts, NO_ALERTS);
export const getAlerts = () => getStore<PriceAlert[]>(KEYS.alerts, NO_ALERTS);
export const setAlerts = (a: PriceAlert[]) => writeStore(KEYS.alerts, a);

export const useClientsStore = () => useLocalStore<Client[]>(KEYS.clients, SEED_CLIENTS);

export function pushNotification(n: Omit<DemoNotification, "id" | "time" | "read">) {
  const list = getStore<DemoNotification[]>(KEYS.notifications, SEED_NOTIFICATIONS);
  writeStore(KEYS.notifications, [{ ...n, id: newId("N"), time: nowTime().slice(0, 5), read: false }, ...list].slice(0, 30));
}

/** Registra una acción del staff en el log de auditoría (con un hash de fantasía). */
export function pushAudit(e: Omit<AuditEntry, "ts" | "hash">) {
  const list = getStore<AuditEntry[]>(KEYS.audit, SEED_AUDIT);
  const hex = () => Math.floor(Math.random() * 0xffff).toString(16).padStart(4, "0");
  writeStore(KEYS.audit, [{ ...e, ts: nowTime(), hash: `0x${hex()}…${hex()}` }, ...list]);
}

// ---------- Cuenta e identidad del inversor ----------

export const useAccountStore = () => useLocalStore<InvestorAccount>(KEYS.account, DEMO_ACCOUNT);
export const getAccount = () => getStore<InvestorAccount>(KEYS.account, DEMO_ACCOUNT);

const accountNumberOf = (a: InvestorAccount) => (a.kind === "new" ? a.accountNumber : DEMO_IDENTITY.accountNumber);
/** Número de cuenta como figura en el padrón del staff ("#84920"). */
const padronOf = (accountNumber: string) => `#${accountNumber.split("-")[0]}`;

/** ¿`account` (en cualquier formato: "#84920", "84920", "84920-1") es la cuenta activa del inversor? */
export function isInvestorAccount(account: string): boolean {
  return account.replace(/^#/, "").split("-")[0] === accountNumberOf(getAccount()).split("-")[0];
}

export interface Investor {
  fullName: string;
  firstName: string;
  email: string;
  phone: string;
  accountNumber: string;
  cuit: string;
  taxCondition: string;
  /** Cuenta abierta desde el onboarding (arranca vacía). */
  isNew: boolean;
  createdAt?: number;
}

/** Identidad del inversor activo: perfil de Ajustes + cuenta (de ejemplo o nueva). */
export function useInvestor(): Investor {
  const [settings] = useSettingsStore();
  const [account] = useAccountStore();
  return useMemo(() => {
    const p = settings.profile;
    return {
      fullName: p.fullName,
      firstName: p.fullName.split(" ")[0] ?? p.fullName,
      email: p.email,
      phone: p.phone,
      accountNumber: accountNumberOf(account),
      cuit: account.kind === "new" ? account.cuit : DEMO_IDENTITY.cuit,
      taxCondition: account.kind === "new" ? "Consumidor final" : currentUser.taxCondition,
      isNew: account.kind === "new",
      createdAt: account.kind === "new" ? account.createdAt : undefined,
    };
  }, [settings.profile, account]);
}

export function useInvestorClient(): Client | undefined {
  const [clients] = useClientsStore();
  const [account] = useAccountStore();
  const padron = padronOf(accountNumberOf(account));
  return clients.find((c) => c.account === padron);
}

/** Motivo por el que la cuenta activa no puede operar (bloqueo o KYC pendiente); null si puede. */
export function useInvestorRestriction(): string | null {
  const me = useInvestorClient();
  if (me?.status === "bloqueado") return "Tu cuenta está bloqueada por Compliance. No podés operar ni retirar fondos; escribinos desde Soporte.";
  if (me?.status === "kyc") return "Tu legajo está en revisión (KYC). Podés depositar, pero no operar ni retirar hasta que se apruebe.";
  return null;
}

export interface NewAccountData {
  firstName: string;
  lastName: string;
  cuit: string;
  email: string;
  phone: string;
  riskProfile: DemoSettings["riskProfile"];
}

const RISK_OF: Record<string, Client["risk"]> = { Conservador: "Bajo", Moderado: "Medio", Agresivo: "Alto" };

/**
 * Alta de una cuenta nueva desde el onboarding: reemplaza a la cuenta de ejemplo en este navegador,
 * arranca sin saldo ni tenencia y queda pendiente de KYC en el padrón del staff.
 * "Reiniciar datos de la demo" (Ajustes) vuelve a la cuenta de ejemplo.
 */
export function createAccount(d: NewAccountData): string {
  const n = 90_000 + Math.floor(Math.random() * 9_000);
  const accountNumber = `${n}-${Math.floor(Math.random() * 9) + 1}`;
  const cuit = d.cuit.replace(/\D/g, "").replace(/^(\d{2})(\d{8})(\d)$/, "$1-$2-$3");
  const fullName = `${d.firstName.trim()} ${d.lastName.trim()}`;
  const createdAt = Date.now();

  writeStore<InvestorAccount>(KEYS.account, { kind: "new", accountNumber, cuit, createdAt });
  const settings = { ...DEFAULT_SETTINGS, ...getStore<DemoSettings>(KEYS.settings, DEFAULT_SETTINGS) };
  writeStore<DemoSettings>(KEYS.settings, { ...settings, profile: { fullName, email: d.email.trim(), phone: d.phone.trim(), address: "" }, riskProfile: d.riskProfile });
  // La cuenta nueva no hereda nada de la cuenta de ejemplo.
  writeStore<LiveOrder[]>(KEYS.orders, []);
  writeStore<Movement[]>(KEYS.movements, []);
  writeStore<LinkedAccount[]>(KEYS.linkedAccounts, []);
  writeStore<boolean>(KEYS.simMode, false);
  writeStore<PriceAlert[]>(KEYS.alerts, []);
  writeStore<DemoNotification[]>(KEYS.notifications, [
    { id: "welcome", title: `¡Bienvenido/a a Nodo, ${d.firstName.trim()}!`, text: `Tu cuenta ${accountNumber} está en revisión. Mientras tanto, vinculá tu banco e ingresá dinero.`, time: "Ahora", read: false, tone: "primary", href: "/dashboard" },
  ]);
  const client: Client = {
    id: `c-${n}`,
    name: fullName,
    initials: `${d.firstName.trim()[0] ?? ""}${d.lastName.trim()[0] ?? ""}`.toUpperCase(),
    account: padronOf(accountNumber),
    cuit,
    email: d.email.trim(),
    phone: d.phone.trim() || "—",
    status: "kyc",
    since: new Date(createdAt).toLocaleDateString("es-AR"),
    equity: 0,
    equityUsd: 0,
    risk: RISK_OF[d.riskProfile ?? "Moderado"] ?? "Medio",
    occupation: "Sin declarar",
    address: "Sin declarar",
    alert: "Alta digital desde la app: validación Renaper y listas UIF en curso.",
  };
  writeStore<Client[]>(KEYS.clients, [client, ...getStore<Client[]>(KEYS.clients, SEED_CLIENTS)]);
  pushAudit({ who: "Onboarding digital", role: "Sistema", action: "Alta de comitente", ref: client.account, detail: `${fullName} · CUIT ${cuit} · perfil ${d.riskProfile ?? "—"}` });
  return accountNumber;
}

/**
 * Aprobación automática del legajo de una cuenta nueva (simula la validación Renaper + UIF).
 * Solo actúa una vez: si el staff ya resolvió el legajo, respeta su decisión.
 */
export function autoApproveIfDue(now: number): boolean {
  const account = getAccount();
  if (account.kind !== "new" || account.autoApproved || now - account.createdAt < AUTO_APPROVAL_MS) return false;
  writeStore<InvestorAccount>(KEYS.account, { ...account, autoApproved: true });
  const clients = getStore<Client[]>(KEYS.clients, SEED_CLIENTS);
  const padron = padronOf(account.accountNumber);
  const me = clients.find((c) => c.account === padron);
  if (me?.status !== "kyc") return false;
  writeStore<Client[]>(KEYS.clients, clients.map((c) => (c.account === padron ? { ...c, status: "activo" as const, alert: undefined } : c)));
  pushAudit({ who: "Motor KYC", role: "Sistema", action: "Aprobación automática de legajo", ref: padron, detail: "Renaper OK · listas UIF/OFAC sin coincidencias" });
  pushNotification({ title: "¡Tu cuenta fue aprobada!", text: "Validamos tu identidad. Ya podés operar y retirar fondos.", tone: "positive", href: "/operar" });
  return true;
}

// ---------- Tesorería (compartida: el inversor encola retiros, el staff los resuelve) ----------

type TreasuryLogRow = (typeof treasuryLog)[number];
export interface TreasuryState {
  queue: TreasuryItem[];
  log: TreasuryLogRow[];
}
const SEED_TREASURY: TreasuryState = { queue: treasuryQueue, log: treasuryLog };
export const useTreasuryStore = () => useLocalStore<TreasuryState>(KEYS.treasury, SEED_TREASURY);

export function pushTreasury(patch: { item?: TreasuryItem; log?: TreasuryLogRow }) {
  const t = getStore<TreasuryState>(KEYS.treasury, SEED_TREASURY);
  writeStore(KEYS.treasury, { queue: patch.item ? [patch.item, ...t.queue] : t.queue, log: patch.log ? [patch.log, ...t.log] : t.log });
}

/** El staff aprobó o rechazó un retiro del inversor: se refleja en su historial y se le notifica. */
export function resolveInvestorMovement(movementId: string, approved: boolean) {
  const list = getStore<Movement[]>(KEYS.movements, SEED_MOVEMENTS);
  const m = list.find((x) => x.id === movementId);
  if (!m) return;
  writeStore(KEYS.movements, list.map((x) => (x.id === movementId ? { ...x, status: approved ? ("Acreditado" as const) : ("Rechazado" as const) } : x)));
  const amount = `${m.currency === "USD" ? "U$S " : "$"}${Math.abs(m.amount).toLocaleString("es-AR", { minimumFractionDigits: 2 })}`;
  pushNotification(
    approved
      ? { title: "Retiro aprobado", text: `Tesorería transfirió ${amount} a tu cuenta bancaria.`, tone: "positive", href: "/cuentas" }
      : { title: "Retiro rechazado", text: `Tesorería rechazó el retiro de ${amount}; los fondos vuelven a tu disponible.`, tone: "negative", href: "/cuentas" },
  );
}
