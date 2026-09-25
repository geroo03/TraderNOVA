"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from "react";
import type { SubmittedOrder } from "./OrderTicket";
import { useMarket } from "@/components/market/MarketProvider";
import { useToast } from "@/components/ui/Toast";
import { getStore, writeStore } from "@/lib/store/local-store";
import { KEYS, REAL_BASE, SEED_MOVEMENTS, SEED_ORDERS, SIM_BASE } from "@/lib/store/demo-data";
import { getAlerts, pushNotification, setAlerts, useMovementsStore, useOrdersStore, useSimModeStore } from "@/lib/store/hooks";
import {
  accountSnapshot,
  availableFor,
  currencyOf,
  isOpenOrder,
  matchOrders,
  sellableQty,
  type AccountSnapshot,
  type LiveOrder,
  type MatchEvent,
  type Movement,
} from "@/lib/trading";
import { formatDecimal, formatInteger } from "@/lib/format";
import { newId, nowTime } from "@/lib/download";

interface TradingState {
  /** Modo simulación: saldo virtual y órdenes separadas de las reales. */
  simMode: boolean;
  setSimMode: (on: boolean) => void;
  /** Órdenes del modo activo (reales o simuladas), las más nuevas primero. */
  orders: LiveOrder[];
  account: AccountSnapshot;
  available: (currency: "ARS" | "USD") => number;
  sellable: (symbol: string) => number;
  submit: (order: SubmittedOrder) => void;
  cancel: (id: string) => void;
  cancelAll: () => void;
  cancelBracket: (id: string) => void;
  resetSimulation: () => void;
  movements: Movement[];
  /** Registra un movimiento; con `settleInMs`, queda "En proceso" y se acredita pasado ese tiempo. */
  addMovement: (m: Omit<Movement, "id" | "date" | "reference" | "settleAt">, settleInMs?: number) => Movement;
}

const TradingContext = createContext<TradingState | null>(null);

const eventText = (e: MatchEvent) => {
  const o = e.order;
  const cur = o.currency === "USD" ? "U$S " : "$";
  const what = `${formatInteger(o.quantity)} ${o.symbol} a ${cur}${formatDecimal(e.price)}`;
  if (e.kind === "fill") return { title: `Orden ejecutada${o.simulated ? " (SIM)" : ""}`, text: `${o.side === "buy" ? "Compraste" : "Vendiste"} ${what}.`, tone: "positive" as const };
  const pnl = `${(e.pnl ?? 0) >= 0 ? "+" : "-"}${cur}${formatDecimal(Math.abs(e.pnl ?? 0))}`;
  return e.kind === "stop"
    ? { title: `Stop loss ejecutado${o.simulated ? " (SIM)" : ""}`, text: `Vendiste ${what}. Resultado ${pnl}.`, tone: "negative" as const }
    : { title: `Take profit alcanzado${o.simulated ? " (SIM)" : ""}`, text: `Vendiste ${what}. Resultado ${pnl}.`, tone: "positive" as const };
};

/**
 * Estado de operaciones de la demo: órdenes persistidas, motor de ejecución que corre con cada
 * tick del feed y saldos/tenencia derivados de lo ejecutado.
 */
export function TradingProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const { prices } = useMarket();
  const [simMode, setSimMode] = useSimModeStore();
  const [all, setOrders] = useOrdersStore();
  const [movements, setMovements] = useMovementsStore();

  const orders = useMemo(() => all.filter((o) => !!o.simulated === simMode), [all, simMode]);
  const account = useMemo(
    () => (simMode ? accountSnapshot(SIM_BASE, orders) : accountSnapshot(REAL_BASE, orders, movements)),
    [simMode, orders, movements],
  );

  const runMatching = useCallback(
    (current: Record<string, number>) => {
      const { orders: next, events } = matchOrders(getStore(KEYS.orders, SEED_ORDERS), current, nowTime(), newId);
      if (!events.length) return;
      writeStore(KEYS.orders, next);
      for (const e of events) {
        const t = eventText(e);
        toast(t);
        pushNotification({ ...t, href: "/ordenes" });
      }
    },
    [toast],
  );

  // Motor de ejecución: cada cambio de precios revisa órdenes abiertas y stops/targets.
  useEffect(() => runMatching(prices), [prices, runMatching]);

  // Alertas de precio configuradas en Cotizaciones.
  useEffect(() => {
    const alerts = getAlerts();
    const hit = alerts.filter((a) => a.active && prices[a.symbol] !== undefined && (a.direction === "above" ? prices[a.symbol] >= a.price : prices[a.symbol] <= a.price));
    if (!hit.length) return;
    setAlerts(alerts.map((a) => (hit.includes(a) ? { ...a, active: false, triggeredAt: nowTime() } : a)));
    for (const a of hit) {
      const t = {
        title: `Alerta de precio: ${a.symbol}`,
        text: `Cotiza ${a.direction === "above" ? "por encima" : "por debajo"} de ${formatDecimal(a.price)} (último ${formatDecimal(prices[a.symbol])}).`,
        tone: "primary" as const,
      };
      toast(t);
      pushNotification({ ...t, href: `/terminal/${a.symbol}` });
    }
  }, [prices, toast]);

  // Acreditación diferida de depósitos (independiente del feed, que puede estar en pausa).
  useEffect(() => {
    const id = setInterval(() => {
      const list = getStore<Movement[]>(KEYS.movements, SEED_MOVEMENTS);
      const due = list.filter((m) => m.status === "En proceso" && m.settleAt && m.settleAt <= Date.now());
      if (!due.length) return;
      writeStore(
        KEYS.movements,
        list.map((m) => (due.includes(m) ? { ...m, status: "Acreditado" as const } : m)),
      );
      for (const m of due) {
        const amount = `${m.currency === "USD" ? "U$S " : "$"}${formatDecimal(Math.abs(m.amount))}`;
        const t =
          m.amount >= 0
            ? { title: "Fondos acreditados", text: `${amount} ya están disponibles para operar.`, tone: "positive" as const }
            : { title: "Retiro transferido", text: `${amount} enviados a tu cuenta bancaria.`, tone: "positive" as const };
        toast(t);
        pushNotification({ ...t, href: "/cuentas" });
      }
    }, 2_000);
    return () => clearInterval(id);
  }, [toast]);

  const submit = useCallback(
    (o: SubmittedOrder) => {
      const market = o.type === "Mercado";
      const order: LiveOrder = {
        id: newId(simMode ? "SIM" : "NYM"),
        time: nowTime(),
        symbol: o.symbol,
        side: o.side,
        type: o.type,
        term: o.term,
        quantity: o.quantity,
        filled: market ? o.quantity : 0,
        price: o.price,
        status: market ? "executed" : "working",
        currency: currencyOf(o.symbol),
        total: o.total,
        ...(o.bracket ? { bracket: o.bracket, ...(market ? { bracketState: "active" as const } : {}) } : {}),
        ...(simMode ? { simulated: true } : {}),
      };
      setOrders((prev) => [order, ...prev]);
      toast(
        market
          ? { title: "Orden ejecutada", text: `${o.side === "buy" ? "Compraste" : "Vendiste"} ${formatInteger(o.quantity)} ${o.symbol} a mercado.` }
          : { title: "Orden enviada", text: `${o.type} de ${formatInteger(o.quantity)} ${o.symbol}. Se ejecuta cuando el precio la alcance.`, tone: "primary" },
      );
      // Una orden límite "marketable" (p. ej. compra por encima del precio) se ejecuta en el acto.
      runMatching(prices);
    },
    [simMode, setOrders, toast, runMatching, prices],
  );

  const cancel = useCallback(
    (id: string) => {
      setOrders((prev) => prev.map((o) => (o.id === id && isOpenOrder(o) ? { ...o, status: "cancelled" } : o)));
      toast({ title: "Orden cancelada", text: id, tone: "neutral" });
    },
    [setOrders, toast],
  );

  const cancelAll = useCallback(() => {
    setOrders((prev) => prev.map((o) => (isOpenOrder(o) && !!o.simulated === simMode ? { ...o, status: "cancelled" } : o)));
    toast({ title: "Órdenes abiertas canceladas", tone: "neutral" });
  }, [setOrders, simMode, toast]);

  const cancelBracket = useCallback(
    (id: string) => {
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, bracketState: "cancelled" } : o)));
      toast({ title: "Stop y target desactivados", text: id, tone: "neutral" });
    },
    [setOrders, toast],
  );

  const resetSimulation = useCallback(() => {
    setOrders((prev) => prev.filter((o) => !o.simulated));
    toast({ title: "Simulación reiniciada", text: "Volviste al saldo virtual inicial.", tone: "neutral" });
  }, [setOrders, toast]);

  const addMovement = useCallback(
    (m: Omit<Movement, "id" | "date" | "reference" | "settleAt">, settleInMs?: number) => {
      const id = newId("MOV");
      const mov: Movement = {
        ...m,
        id,
        date: `Hoy, ${nowTime().slice(0, 5)} hs`,
        reference: `ID: ${id}`,
        ...(settleInMs ? { status: "En proceso" as const, settleAt: Date.now() + settleInMs } : {}),
      };
      setMovements((prev) => [mov, ...prev]);
      return mov;
    },
    [setMovements],
  );

  const value = useMemo<TradingState>(
    () => ({
      simMode,
      setSimMode,
      orders,
      account,
      available: (c) => availableFor(account, c),
      sellable: (s) => sellableQty(account, s),
      submit,
      cancel,
      cancelAll,
      cancelBracket,
      resetSimulation,
      movements,
      addMovement,
    }),
    [simMode, setSimMode, orders, account, submit, cancel, cancelAll, cancelBracket, resetSimulation, movements, addMovement],
  );
  return <TradingContext value={value}>{children}</TradingContext>;
}

export function useTrading(): TradingState {
  const ctx = useContext(TradingContext);
  if (!ctx) throw new Error("useTrading debe usarse dentro de <TradingProvider>.");
  return ctx;
}
