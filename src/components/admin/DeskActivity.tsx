"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { table } from "@/components/ui/Page";
import { Tabs } from "@/components/ui/Tabs";
import { deskEvents, type ActivityKind } from "@/lib/admin-data";

const kindTone = { orden: "primary", fondos: "positive", kyc: "neutral" } as const;

export function DeskActivity() {
  const [filter, setFilter] = useState<"all" | ActivityKind>("all");
  const rows = deskEvents.filter((e) => filter === "all" || e.kind === filter);

  return (
    <div className="flex flex-col gap-3">
      <Tabs
        size="sm"
        label="Tipo de evento"
        value={filter}
        onChange={setFilter}
        items={[
          { id: "all", label: "Todas" },
          { id: "orden", label: "Órdenes" },
          { id: "fondos", label: "Fondos" },
          { id: "kyc", label: "KYC" },
        ]}
      />
      <div className={table.wrap}>
        <table className={`${table.table} min-w-[640px]`}>
          <thead>
            <tr>
              {["Hora", "Comitente", "Acción / detalle", "Monto", "Estado"].map((h) => (
                <th key={h} className={table.th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.time} className={table.row}>
                <td className={`${table.td} font-mono text-fg-subtle`}>{e.time}</td>
                <td className={table.td}>
                  <span className="block font-semibold">{e.client}</span>
                  <span className="font-mono text-[10px] text-fg-subtle">Cta. {e.account}</span>
                </td>
                <td className={table.td}>
                  <Badge tone={kindTone[e.kind]}>{e.action}</Badge>
                  <span className="block pt-1 text-fg-subtle">{e.detail}</span>
                </td>
                <td className={`${table.td} font-mono font-semibold`}>{e.amount}</td>
                <td className={table.td}>
                  <Badge tone={e.tone} pill>
                    {e.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
