"use client";

import { useState } from "react";
import { OpenOrders } from "./OpenOrders";
import { useTrading } from "./TradingProvider";
import { Tabs } from "@/components/ui/Tabs";
import { Button, ButtonLink } from "@/components/ui/Button";
import { MsIcon } from "@/components/ui/MsIcon";
import { downloadFile, stamp, toCsv } from "@/lib/download";
import { isOpenOrder, type LiveOrder } from "@/lib/trading";

type Filter = "all" | "open" | "executed" | "cancelled";

export function OrdersHistory() {
  const { orders, cancel, cancelAll, cancelBracket, simMode } = useTrading();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const visible = orders
    .filter((o) => (filter === "all" ? true : filter === "open" ? isOpenOrder(o) : o.status === filter))
    .filter((o) => !q || `${o.id} ${o.symbol} ${o.type}`.toLowerCase().includes(q));

  function exportCsv(rows: LiveOrder[]) {
    downloadFile(
      `ordenes-nodo${simMode ? "-sim" : ""}_${stamp()}.csv`,
      toCsv(
        ["id", "hora", "especie", "operacion", "tipo", "plazo", "cantidad", "ejecutada", "precio", "moneda", "estado", "stop", "target"],
        rows.map((o) => [o.id, o.time, o.symbol, o.side === "buy" ? "compra" : "venta", o.type, o.term, o.quantity, o.filled, o.price, o.currency, o.status, o.bracket?.stop, o.bracket?.target]),
      ),
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Tabs
          label="Estado"
          value={filter}
          onChange={setFilter}
          items={[
            { id: "all", label: "Todas", count: orders.length },
            { id: "open", label: "Abiertas", count: orders.filter(isOpenOrder).length },
            { id: "executed", label: "Ejecutadas", count: orders.filter((o) => o.status === "executed").length },
            { id: "cancelled", label: "Canceladas", count: orders.filter((o) => o.status === "cancelled").length },
          ]}
        />
        <div className="flex flex-wrap gap-2">
          <label className="flex items-center gap-2 rounded-lg bg-surface-high px-3 py-1.5">
            <MsIcon name="search" size={16} className="text-fg-subtle" />
            <span className="sr-only">Buscar orden</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ID o especie…" className="w-32 bg-transparent text-xs outline-none" />
          </label>
          <Button variant="secondary" size="sm" icon="download" onClick={() => exportCsv(visible)} disabled={visible.length === 0}>
            Exportar CSV
          </Button>
          <Button variant="danger" size="sm" onClick={cancelAll} disabled={orders.filter(isOpenOrder).length === 0}>
            Cancelar abiertas
          </Button>
          <ButtonLink href="/operar" size="sm" icon="add">
            Nueva orden
          </ButtonLink>
        </div>
      </div>
      <OpenOrders orders={visible} onCancel={cancel} onCancelBracket={cancelBracket} />
    </div>
  );
}
