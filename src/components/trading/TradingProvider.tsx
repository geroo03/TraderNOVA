"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from "react";
import type { SubmittedOrder } from "./OrderTicket";
import { useMarket } from "@/components/market/MarketProvider";
import { useToast } from "@/components/ui/Toast";
import { getStore, writeStore } from "@/lib/store/local-store";
import { EMPTY_BASE, KEYS, REAL_BASE, SEED_MOVEMENTS, SEED_ORDERS, SIM_BASE } from "@/lib/store/demo-data";
import {
  autoApproveIfDue,
  getAlerts,
  pushNotification,
  setAlerts,
  useAccountStore,
  useInvestorRestriction,
  useMovementsStore,
  useOrdersStore,
  useSimModeStore,
} from "@/lib/store/hooks";
import { useNow } from "@/lib/store/clock";
import { orderValidUntil } from "@/lib/session";
import {
  accountSnapshot,
  availableFor,
  currencyOf,
  expireOrders,
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
  /**
   * Registra un movimiento. Con `settleInMs` queda "En proceso" y se acredita pasado ese tiempo;
   * con `maturesInMs` (cauciones) se cobra capital + `payout` al vencer.
   */
  addMovement: (m: Omit<Movement, "id" | "date" | "reference" | "settleAt" | "maturesAt">, opts?: { settleInMs?: number; maturesInMs?: number }) => Movement;
  /** Motivo por el que no se puede operar en el modo activo (cuenta bloqueada o en KYC); null si puede. */
  restriction: string | null;
  /** Igual que `restriction` pero para la cuenta real, sin importar el modo (retiros, MEP, caución). */
  accountRestriction: string | null;
  marketOpen: boolean;
}

const TradingContext = createContext<TradingState | null>(null);

const eventText = (e: MatchEvent) => {
  const o = e.order;
  const cur = o.currency === "USD" ? "U$S " : "$";
  const what = `${formatInteger(e.qty)} ${o.symbol} a ${cur}${formatDecimal(e.price)}`;
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
  const { prices, session } = useMarket();
  const now = useNow();
  const accountRestriction = useInvestorRestriction();
  const [simMode, setSimMode] = useSimModeStore();
  const [all, setOrders] = useOrdersStore();
  const [movements, setMovements] = useMovementsStore();

  const [investorAccount] = useAccountStore();
  const orders = useMemo(() => all.filter((o) => !!o.simulated === simMode), [all, simMode]);
  // La cuenta de ejemplo arranca con la cartera del Figma; una cuenta nueva, vacía.
  const realBase = investorAccount.kind === "new" ? EMPTY_BASE : REAL_BASE;
  const account = useMemo(
    () => (simMode ? accountSnapshot(SIM_BASE, orders) : accountSnapshot(realBase, orders, movements)),
    [simMode, orders, movements, realBase],
  );

  const runMatching = useCallback(
    (current: Record<string, number>) => {
      // Con la rueda cerrada (o antes de conocer la hora) solo se ejecuta lo simulado: la simulación opera 24/7.
      const eligible = (o: LiveOrder) => !!o.simulated || (session.open && (session.forced || now !== null));
      const { orders: next, events } = matchOrders(getStore(KEYS.orders, SEED_ORDERS), current, nowTime(), newId, eligible);
      if (!events.length) return;
      writeStore(KEYS.orders, next);
      for (const e of events) {
        const t = eventText(e);
        toast(t);
        pushNotification({ ...t, href: "/ordenes" });
      }
    },
    [toast, session.open, session.forced, now],
  );

  // Vencimiento de las órdenes del día al cierre de la rueda.
  useEffect(() => {
    if (now === null) return;
    const { orders: next, expired } = expireOrders(getStore(KEYS.orders, SEED_ORDERS), now);
    if (!expired.length) return;
    writeStore(KEYS.orders, next);
    const t = { title: `${expired.length} orden(es) vencida(s)`, text: `${expired.map((o) => o.symbol).join(", ")}: cerró la rueda sin ejecutarse.`, tone: "neutral" as const };
    toast(t);
    pushNotification({ ...t, href: "/ordenes" });
  }, [now, toast]);

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
      const t0 = Date.now();
      // Aprobación automática del legajo de una cuenta nueva (la notificación la genera el helper).
      if (autoApproveIfDue(t0)) toast({ title: "¡Tu cuenta fue aprobada!", text: "Ya podés operar y retirar fondos." });
      const list = getStore<Movement[]>(KEYS.movements, SEED_MOVEMENTS);
      const due = list.filter((m) => m.status === "En proceso" && m.settleAt && m.settleAt <= t0);
      const matured = list.filter((m) => m.status === "Colocada" && m.maturesAt && m.maturesAt <= t0);
      if (!due.length && !matured.length) return;
      // Al vencer una caución se marca como cobrada y se acredita capital + interés.
      const rescues: Movement[] = matured.map((m) => {
        const rid = newId("MOV");
        return {
          id: rid,
          date: `Hoy, ${nowTime().slice(0, 5)} hs`,
          reference: `ID: ${rid}`,
          kind: "caucion",
          title: "Rescate de caución (capital + interés)",
          counterparty: m.title,
          amount: m.payout ?? -m.amount,
          currency: m.currency,
          status: "Acreditado",
        };
      });
      writeStore(KEYS.movements, [
        ...rescues,
        ...list.map((m) => (due.includes(m) ? { ...m, status: "Acreditado" as const } : matured.includes(m) ? { ...m, status: "Cobrada" as const } : m)),
      ]);
      for (const r of rescues) {
        const t = { title: "Caución cobrada", text: `Se acreditaron $${formatDecimal(r.amount)} (capital + interés).`, tone: "positive" as const };
        toast(t);
        pushNotification({ ...t, href: "/cuentas" });
      }
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
      if (!simMode && accountRestriction) {
        toast({ title: "Operación no permitida", text: accountRestriction, tone: "negative" });
        return;
      }
      if (!simMode && market && !session.open) {
        toast({ title: "Mercado cerrado", text: "Las órdenes a mercado solo se pueden enviar en horario de rueda.", tone: "negative" });
        return;
      }
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
        // Las órdenes reales son "del día": vencen al cierre de su rueda.
        ...(!simMode && !market ? { validUntil: orderValidUntil(Date.now()) } : {}),
      };
      setOrders((prev) => [order, ...prev]);
      toast(
        market
          ? { title: "Orden ejecutada", text: `${o.side === "buy" ? "Compraste" : "Vendiste"} ${formatInteger(o.quantity)} ${o.symbol} a mercado.` }
          : !simMode && !session.open
            ? { title: "Orden cargada para la próxima rueda", text: `${o.type} de ${formatInteger(o.quantity)} ${o.symbol}. Mercado ${session.label}.`, tone: "primary" }
            : { title: "Orden enviada", text: `${o.type} de ${formatInteger(o.quantity)} ${o.symbol}. Se ejecuta cuando el precio la alcance.`, tone: "primary" },
      );
      // Una orden límite "marketable" (p. ej. compra por encima del precio) se ejecuta en el acto.
      runMatching(prices);
    },
    [simMode, setOrders, toast, runMatching, prices, accountRestriction, session],
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
    (m: Omit<Movement, "id" | "date" | "reference" | "settleAt" | "maturesAt">, opts: { settleInMs?: number; maturesInMs?: number } = {}) => {
      const id = newId("MOV");
      const mov: Movement = {
        ...m,
        id,
        date: `Hoy, ${nowTime().slice(0, 5)} hs`,
        reference: `ID: ${id}`,
        ...(opts.settleInMs ? { status: "En proceso" as const, settleAt: Date.now() + opts.settleInMs } : {}),
        ...(opts.maturesInMs ? { maturesAt: Date.now() + opts.maturesInMs } : {}),
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
      restriction: simMode ? null : accountRestriction,
      accountRestriction,
      marketOpen: session.open,
    }),
    [simMode, setSimMode, orders, account, submit, cancel, cancelAll, cancelBracket, resetSimulation, movements, addMovement, accountRestriction, session.open],
  );
  return <TradingContext value={value}>{children}</TradingContext>;
}

export function useTrading(): TradingState {
  const ctx = useContext(TradingContext);
  if (!ctx) throw new Error("useTrading debe usarse dentro de <TradingProvider>.");
  return ctx;
}
