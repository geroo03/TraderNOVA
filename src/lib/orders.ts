import type { Order } from "./types";
import { findInstrument } from "./market-data";
import { orderCosts, type OrderCosts, type Side } from "./order-costs";

/**
 * Los bonos en BYMA cotizan cada 100 de valor nominal, así que el monto es
 * cantidad × precio / 100. Acciones y CEDEARs cotizan por unidad.
 */
export function estimatedAmount(order: Pick<Order, "instrument" | "quantity" | "limitPrice">): number {
  const perUnitDivisor = order.instrument === "Bono USD" ? 100 : 1;
  return (order.quantity * order.limitPrice) / perUnitDivisor;
}

/** Divisor de cotización por especie: los bonos cotizan cada 100 VN. */
export function priceDivisor(symbol: string): number {
  return findInstrument(symbol)?.board === "Bono" ? 100 : 1;
}

/** Costos de una orden de `symbol` teniendo en cuenta cómo cotiza (por unidad o cada 100 VN). */
export function orderValue(symbol: string, quantity: number, price: number, side: Side): OrderCosts {
  return orderCosts(quantity, price / priceDivisor(symbol), side);
}
