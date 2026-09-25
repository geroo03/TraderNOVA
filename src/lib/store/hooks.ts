"use client";

/** Accesos tipados al estado persistente compartido por inversor y staff. */
import { useMemo } from "react";
import { getStore, useLocalStore, writeStore } from "./local-store";
import {
  DEFAULT_SETTINGS,
  DEFAULT_WATCHLIST,
  KEYS,
  SEED_MOVEMENTS,
  SEED_NOTIFICATIONS,
  SEED_ORDERS,
  SEED_TICKETS,
  type AuditEntry,
  type DemoNotification,
  type DemoSettings,
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

/** Cuenta del inversor de la demo en el padrón del staff: su estado habilita o restringe la operatoria. */
const INVESTOR_ACCOUNT = `#${currentUser.accountNumber.split("-")[0]}`;
export const isInvestorAccount = (account: string) => account.replace(/^#/, "").split("-")[0] === INVESTOR_ACCOUNT.slice(1);

export function useInvestorRestriction(): string | null {
  const [clients] = useClientsStore();
  const me = clients.find((c) => c.account === INVESTOR_ACCOUNT);
  if (me?.status === "bloqueado") return "Tu cuenta está bloqueada por Compliance. No podés operar ni retirar fondos; escribinos desde Soporte.";
  if (me?.status === "kyc") return "Tu legajo está en revisión (KYC). Podés depositar, pero no operar ni retirar hasta que se apruebe.";
  return null;
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
