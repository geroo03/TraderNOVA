"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { MsIcon } from "@/components/ui/MsIcon";
import { table } from "@/components/ui/Page";
import { Tabs } from "@/components/ui/Tabs";
import type { MsIconName } from "@/components/ui/ms-icon-names";
import { movements, type MovementKind } from "@/lib/accounts";
import { formatDecimal } from "@/lib/format";

const kindIcon: Record<MovementKind, { icon: MsIconName; cls: string }> = {
  deposit: { icon: "south_west", cls: "text-positive bg-positive/15" },
  withdrawal: { icon: "north_east", cls: "text-negative bg-alert/15" },
  mep: { icon: "currency_exchange", cls: "text-primary bg-primary/15" },
  income: { icon: "payments", cls: "text-positive bg-positive/15" },
};

type Filter = "all" | MovementKind;

export function MovementsTable() {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const rows = movements
    .filter((m) => filter === "all" || m.kind === filter)
    .filter((m) => !q || `${m.title} ${m.counterparty} ${m.reference}`.toLowerCase().includes(q));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Tabs
          label="Tipo de movimiento"
          value={filter}
          onChange={setFilter}
          items={[
            { id: "all", label: "Todos" },
            { id: "deposit", label: "Depósitos" },
            { id: "withdrawal", label: "Retiros" },
            { id: "mep", label: "Operaciones MEP" },
            { id: "income", label: "Dividendos & rentas" },
          ]}
        />
        <label className="flex items-center gap-2 rounded-lg bg-surface-high px-3 py-1.5">
          <MsIcon name="search" size={16} className="text-fg-subtle" />
          <span className="sr-only">Buscar movimiento</span>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por ID, banco…" className="w-40 bg-transparent text-xs outline-none" />
        </label>
      </div>
      <div className={table.wrap}>
        <table className={`${table.table} min-w-[760px]`}>
          <thead>
            <tr>
              <th className={table.th}>Fecha / hora</th>
              <th className={table.th}>Tipo de movimiento</th>
              <th className={table.th}>Cuenta / origen / destino</th>
              <th className={`${table.th} text-right`}>Monto</th>
              <th className={`${table.th} text-right`}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => {
              const k = kindIcon[m.kind];
              return (
                <tr key={m.id} className={table.row}>
                  <td className={table.td}>
                    <span className="block font-semibold">{m.date}</span>
                    <span className="font-mono text-[10px] text-fg-subtle">{m.reference}</span>
                  </td>
                  <td className={table.td}>
                    <span className="flex items-center gap-2">
                      <span className={`flex size-7 items-center justify-center rounded-md ${k.cls}`}>
                        <MsIcon name={k.icon} size={14} />
                      </span>
                      {m.title}
                    </span>
                  </td>
                  <td className={`${table.td} text-fg-subtle`}>{m.counterparty}</td>
                  <td className={`${table.td} text-right font-mono font-semibold ${m.amount >= 0 ? "text-positive" : "text-negative"}`}>
                    {m.amount >= 0 ? "+" : "-"} {m.currency === "USD" ? "U$S " : "$"}
                    {formatDecimal(Math.abs(m.amount))}
                  </td>
                  <td className={`${table.td} text-right`}>
                    <Badge tone={m.status === "En proceso" ? "primary" : "positive"} pill>
                      {m.status}
                    </Badge>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-xs text-fg-subtle">
                  Sin movimientos para este filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
