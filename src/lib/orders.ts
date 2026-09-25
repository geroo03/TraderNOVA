import type { Order } from "./types";

/**
 * Los bonos en BYMA cotizan cada 100 de valor nominal, así que el monto es
 * cantidad × precio / 100. Acciones y CEDEARs cotizan por unidad.
 */
export function estimatedAmount(order: Pick<Order, "instrument" | "quantity" | "limitPrice">): number {
  const perUnitDivisor = order.instrument === "Bono USD" ? 100 : 1;
  return (order.quantity * order.limitPrice) / perUnitDivisor;
}
