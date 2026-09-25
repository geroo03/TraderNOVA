"use client";

import { useCallback, useState } from "react";
import type { LiveOrder } from "./OpenOrders";
import type { SubmittedOrder } from "./OrderTicket";

export const seedOrders: LiveOrder[] = [
  { id: "NYM-92841", time: "14:32:10", symbol: "GGAL", side: "buy", type: "Límite", term: "24hs", quantity: 200, filled: 0, price: 4_820, status: "working" },
  { id: "NYM-92790", time: "12:40:02", symbol: "AL30D", side: "sell", type: "Límite", term: "48hs", quantity: 1_000, filled: 600, price: 58.4, status: "partial" },
];

function nowTime(): string {
  return new Date().toLocaleTimeString("es-AR", { hour12: false });
}

/** Estado local de órdenes de la demo (se pierde al recargar: no hay backend). */
export function useOrders(initial: LiveOrder[] = seedOrders) {
  const [orders, setOrders] = useState<LiveOrder[]>(initial);

  const add = useCallback((o: SubmittedOrder) => {
    setOrders((prev) => [
      {
        id: `NYM-${93000 + prev.length}`,
        time: nowTime(),
        symbol: o.symbol,
        side: o.side,
        type: o.type,
        term: o.term,
        quantity: o.quantity,
        // Las órdenes a mercado se simulan ejecutadas al instante.
        filled: o.type === "Mercado" ? o.quantity : 0,
        price: o.price,
        status: o.type === "Mercado" ? "executed" : "working",
      },
      ...prev,
    ]);
  }, []);

  const cancel = useCallback((id: string) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: "cancelled" } : o)));
  }, []);

  const cancelAll = useCallback(() => {
    setOrders((prev) => prev.map((o) => (o.status === "working" || o.status === "partial" ? { ...o, status: "cancelled" } : o)));
  }, []);

  return { orders, add, cancel, cancelAll };
}
