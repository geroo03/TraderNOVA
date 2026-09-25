"use client";

/** Accesos tipados al estado persistente compartido por inversor y staff. */
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
import { auditLog as SEED_AUDIT, clients as SEED_CLIENTS, type Client } from "../admin-data";
import type { LiveOrder, Movement } from "../trading";
import { newId, nowTime } from "../download";

export const useOrdersStore = () => useLocalStore<LiveOrder[]>(KEYS.orders, SEED_ORDERS);
export const useMovementsStore = () => useLocalStore<Movement[]>(KEYS.movements, SEED_MOVEMENTS);
export const useSimModeStore = () => useLocalStore<boolean>(KEYS.simMode, false);
export const useNotificationsStore = () => useLocalStore<DemoNotification[]>(KEYS.notifications, SEED_NOTIFICATIONS);
export const useWatchlistStore = () => useLocalStore<string[]>(KEYS.watchlist, DEFAULT_WATCHLIST);
export const useLinkedAccountsStore = () => useLocalStore<LinkedAccount[]>(KEYS.linkedAccounts, SEED_LINKED);
export const useSettingsStore = () => useLocalStore<DemoSettings>(KEYS.settings, DEFAULT_SETTINGS);
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
