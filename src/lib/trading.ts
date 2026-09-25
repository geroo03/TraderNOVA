/**
 * Modelo de órdenes y cuenta de la demo, en funciones puras (sin React) para poder testearlas.
 * El saldo y la tenencia no se guardan: se derivan del saldo base + movimientos + órdenes ejecutadas.
 */
import type { Bracket } from "./bracket";
import { findInstrument } from "./market-data";
import type { Side } from "./order-costs";
import { orderValue, priceDivisor } from "./orders";

export type LiveOrderStatus = "working" | "partial" | "executed" | "cancelled";

export interface LiveOrder {
  id: string;
  time: string;
  symbol: string;
  side: Side;
  type: string;
  term: string;
  quantity: number;
  filled: number;
  price: number;
  status: LiveOrderStatus;
  currency: "ARS" | "USD";
  /** Monto total con aranceles al momento de enviarla (informativo). */
  total?: number;
  bracket?: Bracket;
  /** Estado del stop/target una vez ejecutada la entrada. */
  bracketState?: "active" | "stopped" | "target" | "cancelled";
  /** Orden de salida generada por un stop/target: referencia a la entrada. */
  parentId?: string;
  simulated?: boolean;
  /** Nominales ya reflejados en el saldo base (órdenes históricas de la semilla). */
  settledQty?: number;
  /** Orden del día: vence al cierre de su rueda (timestamp ms). Las simuladas no vencen. */
  validUntil?: number;
  /** Aclaración visible en la tabla (p. ej. "Vencida al cierre de la rueda"). */
  note?: string;
}

export const isOpenOrder = (o: Pick<LiveOrder, "status">) => o.status === "working" || o.status === "partial";

export type MovementKind = "deposit" | "withdrawal" | "mep" | "income" | "caucion";
export type MovementStatus = "Acreditado" | "Liquidado T+1" | "En proceso" | "Rechazado" | "Colocada" | "Cobrada";

export interface Movement {
  id: string;
  date: string;
  kind: MovementKind;
  title: string;
  reference: string;
  counterparty: string;
  /** Positivo = ingresa a la cuenta; negativo = sale. */
  amount: number;
  currency: "ARS" | "USD";
  status: MovementStatus;
  /** Movimiento histórico: ya está incluido en el saldo base. */
  historic?: boolean;
  /** Timestamp (ms) en que un depósito "En proceso" pasa a acreditado. */
  settleAt?: number;
  /** Caución: cuándo vence y cuánto devuelve (capital + interés). */
  maturesAt?: number;
  payout?: number;
}

export interface Position {
  qty: number;
  avgPrice: number;
}

export interface AccountBase {
  ars: number;
  usd: number;
  positions: Record<string, Position>;
}

export interface AccountSnapshot {
  ars: number;
  usd: number;
  reservedArs: number;
  reservedUsd: number;
  availableArs: number;
  availableUsd: number;
  positions: Record<string, Position>;
  /** Nominales comprometidos en órdenes de venta abiertas. */
  reservedQty: Record<string, number>;
}

/** Un movimiento impacta en el saldo si no es histórico y (en ingresos) ya se acreditó. */
function movementCounts(m: Movement): boolean {
  if (m.historic || m.status === "Rechazado") return false;
  return m.amount < 0 || m.status !== "En proceso";
}

export function accountSnapshot(base: AccountBase, orders: LiveOrder[], movements: Movement[] = []): AccountSnapshot {
  const cash = { ARS: base.ars, USD: base.usd };
  const reserved = { ARS: 0, USD: 0 };
  const positions: Record<string, Position> = {};
  for (const [s, p] of Object.entries(base.positions)) positions[s] = { ...p };
  const reservedQty: Record<string, number> = {};

  for (const m of movements) if (movementCounts(m)) cash[m.currency] += m.amount;

  // Orden cronológico (las más viejas primero) para que el PPC se calcule bien.
  for (const o of [...orders].reverse()) {
    const newFill = o.filled - (o.settledQty ?? 0);
    if (newFill > 0) {
      const value = orderValue(o.symbol, newFill, o.price, o.side).total;
      const pos = (positions[o.symbol] ??= { qty: 0, avgPrice: 0 });
      if (o.side === "buy") {
        cash[o.currency] -= value;
        pos.avgPrice = (pos.avgPrice * pos.qty + o.price * newFill) / (pos.qty + newFill);
        pos.qty += newFill;
      } else {
        cash[o.currency] += value;
        pos.qty -= newFill;
      }
    }
    const remaining = o.quantity - o.filled;
    if (isOpenOrder(o) && remaining > 0) {
      if (o.side === "buy") reserved[o.currency] += orderValue(o.symbol, remaining, o.price, "buy").total;
      else reservedQty[o.symbol] = (reservedQty[o.symbol] ?? 0) + remaining;
    }
  }

  for (const s of Object.keys(positions)) if (positions[s].qty <= 0) delete positions[s];
  const round = (n: number) => Math.round(n * 100) / 100;
  return {
    ars: round(cash.ARS),
    usd: round(cash.USD),
    reservedArs: round(reserved.ARS),
    reservedUsd: round(reserved.USD),
    availableArs: round(cash.ARS - reserved.ARS),
    availableUsd: round(cash.USD - reserved.USD),
    positions,
    reservedQty,
  };
}

/** Nominales que se pueden vender: tenencia menos lo comprometido en ventas abiertas. */
export function sellableQty(snapshot: AccountSnapshot, symbol: string): number {
  return Math.max(0, (snapshot.positions[symbol]?.qty ?? 0) - (snapshot.reservedQty[symbol] ?? 0));
}

export function availableFor(snapshot: AccountSnapshot, currency: "ARS" | "USD"): number {
  return currency === "USD" ? snapshot.availableUsd : snapshot.availableArs;
}

export interface MatchEvent {
  kind: "fill" | "stop" | "target";
  order: LiveOrder;
  price: number;
  /** Nominales ejecutados en este evento (en una orden parcial, solo el remanente). */
  qty: number;
  /** Resultado bruto de la salida (stop/target) respecto de la entrada. */
  pnl?: number;
}

/** ¿La orden abierta se ejecuta con este precio de mercado? */
export function crosses(o: Pick<LiveOrder, "side" | "type" | "price">, market: number): boolean {
  if (o.type === "Stop Límite") return o.side === "buy" ? market >= o.price : market <= o.price;
  return o.side === "buy" ? market <= o.price : market >= o.price;
}

/**
 * Motor de ejecución simulado: ejecuta órdenes límite/stop que cruzan el precio y dispara
 * stop loss / take profit de entradas ejecutadas. Devuelve la lista nueva solo si hubo cambios.
 */
export function matchOrders(
  orders: LiveOrder[],
  prices: Record<string, number>,
  time: string,
  makeId: (prefix: string) => string,
  /** Qué órdenes pueden ejecutarse ahora (p. ej. con el mercado cerrado, solo las simuladas). */
  eligible: (o: LiveOrder) => boolean = () => true,
): { orders: LiveOrder[]; events: MatchEvent[] } {
  const events: MatchEvent[] = [];
  const exits: LiveOrder[] = [];

  const next = orders.map((o) => {
    const p = prices[o.symbol];
    if (p === undefined || !eligible(o)) return o;

    if (isOpenOrder(o) && o.type !== "Mercado" && crosses(o, p)) {
      const filled: LiveOrder = { ...o, filled: o.quantity, status: "executed", ...(o.bracket ? { bracketState: "active" as const } : {}) };
      events.push({ kind: "fill", order: filled, price: o.price, qty: o.quantity - o.filled });
      return filled;
    }

    if (o.status === "executed" && o.bracketState === "active" && o.bracket && o.side === "buy") {
      const hit = p <= o.bracket.stop ? "stop" : p >= o.bracket.target ? "target" : null;
      if (!hit) return o;
      const level = hit === "stop" ? o.bracket.stop : o.bracket.target;
      const exit: LiveOrder = {
        id: makeId(o.simulated ? "SIM" : "NYM"),
        time,
        symbol: o.symbol,
        side: "sell",
        type: hit === "stop" ? "Stop loss" : "Take profit",
        term: "CI",
        quantity: o.quantity,
        filled: o.quantity,
        price: level,
        status: "executed",
        currency: o.currency,
        parentId: o.id,
        ...(o.simulated ? { simulated: true } : {}),
      };
      exits.push(exit);
      events.push({ kind: hit, order: exit, price: level, qty: o.quantity, pnl: ((level - o.price) * o.quantity) / priceDivisor(o.symbol) });
      return { ...o, bracketState: hit === "stop" ? ("stopped" as const) : ("target" as const) };
    }
    return o;
  });

  return { orders: events.length ? [...exits, ...next] : orders, events };
}

/** Cancela las órdenes del día que pasaron su vencimiento. Devuelve las vencidas para notificarlas. */
export function expireOrders(orders: LiveOrder[], now: number): { orders: LiveOrder[]; expired: LiveOrder[] } {
  const expired: LiveOrder[] = [];
  const next = orders.map((o) => {
    if (!isOpenOrder(o) || o.validUntil === undefined || o.validUntil > now) return o;
    const done: LiveOrder = { ...o, status: "cancelled", note: "Vencida al cierre de la rueda" };
    expired.push(done);
    return done;
  });
  return { orders: expired.length ? next : orders, expired };
}

/** Moneda de liquidación de una especie. */
export function currencyOf(symbol: string): "ARS" | "USD" {
  return findInstrument(symbol)?.currency ?? "ARS";
}
