import { findInstrument } from "./market-data";
import { orderCosts, type OrderCosts, type Side } from "./order-costs";

/** Divisor de cotización por especie: los bonos cotizan cada 100 VN. */
export function priceDivisor(symbol: string): number {
  return findInstrument(symbol)?.board === "Bono" ? 100 : 1;
}

/** Costos de una orden de `symbol` teniendo en cuenta cómo cotiza (por unidad o cada 100 VN). */
export function orderValue(symbol: string, quantity: number, price: number, side: Side): OrderCosts {
  return orderCosts(quantity, price / priceDivisor(symbol), side);
}
