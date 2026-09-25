"use client";

import { useState } from "react";
import { OpenOrders, type LiveOrder } from "./OpenOrders";
import { useOrders } from "./useOrders";
import { Tabs } from "@/components/ui/Tabs";
import { Button, ButtonLink } from "@/components/ui/Button";

const history: LiveOrder[] = [
  { id: "NYM-92841", time: "14:32:10", symbol: "GGAL", side: "buy", type: "Límite", term: "24hs", quantity: 200, filled: 0, price: 4_820, status: "working" },
  { id: "NYM-92790", time: "12:40:02", symbol: "AL30D", side: "sell", type: "Límite", term: "48hs", quantity: 1_000, filled: 600, price: 58.4, status: "partial" },
  { id: "NYM-92702", time: "12:15:04", symbol: "AAPL", side: "buy", type: "Límite", term: "CI", quantity: 50, filled: 50, price: 18_350, status: "executed" },
  { id: "NYM-92655", time: "11:48:31", symbol: "MELI", side: "buy", type: "Mercado", term: "24hs", quantity: 20, filled: 20, price: 26_690, status: "executed" },
  { id: "NYM-92610", time: "11:05:22", symbol: "TXAR", side: "sell", type: "Límite", term: "24hs", quantity: 800, filled: 0, price: 1_150, status: "cancelled" },
  { id: "NYM-92588", time: "10:48:19", symbol: "YPFD", side: "buy", type: "Stop Límite", term: "24hs", quantity: 100, filled: 100, price: 28_300, status: "executed" },
];

type Filter = "all" | "open" | "executed" | "cancelled";

export function OrdersHistory() {
  const { orders, cancel, cancelAll } = useOrders(history);
  const [filter, setFilter] = useState<Filter>("all");
  const isOpen = (o: LiveOrder) => o.status === "working" || o.status === "partial";
  const visible = orders.filter((o) =>
    filter === "all" ? true : filter === "open" ? isOpen(o) : o.status === filter,
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Tabs
          label="Estado"
          value={filter}
          onChange={setFilter}
          items={[
            { id: "all", label: "Todas", count: orders.length },
            { id: "open", label: "Abiertas", count: orders.filter(isOpen).length },
            { id: "executed", label: "Ejecutadas", count: orders.filter((o) => o.status === "executed").length },
            { id: "cancelled", label: "Canceladas", count: orders.filter((o) => o.status === "cancelled").length },
          ]}
        />
        <div className="flex gap-2">
          <Button variant="danger" size="sm" onClick={cancelAll} disabled={orders.filter(isOpen).length === 0}>
            Cancelar abiertas
          </Button>
          <ButtonLink href="/operar" size="sm" icon="add">
            Nueva orden
          </ButtonLink>
        </div>
      </div>
      <OpenOrders orders={visible} onCancel={cancel} />
    </div>
  );
}
