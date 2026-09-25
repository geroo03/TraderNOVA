"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Change } from "@/components/ui/Amount";
import { table } from "@/components/ui/Page";
import { Tabs } from "@/components/ui/Tabs";
import { formatDecimal, formatInteger, formatPercent } from "@/lib/format";
import { holdings, type AssetClass, type Holding } from "@/lib/portfolio";

type Filter = "all" | AssetClass;

function money(h: Holding, v: number) {
  return `${h.currency === "USD" ? "U$S " : "$"}${formatDecimal(v)}`;
}

function toCsv(rows: Holding[]): string {
  const header = "especie,clase,cantidad,ppc,ultimo,valuacion,ganancia,ganancia_pct,moneda";
  const lines = rows.map((h) =>
    [h.symbol, h.assetClass, h.quantity, h.avgPrice, h.lastPrice, h.valuation.toFixed(2), h.gain.toFixed(2), h.gainPct.toFixed(2), h.currency].join(","),
  );
  return [header, ...lines].join("\n");
}

export function HoldingsTable() {
  const [filter, setFilter] = useState<Filter>("all");
  const rows = holdings.filter((h) => filter === "all" || h.assetClass === filter);
  const count = (c: AssetClass) => holdings.filter((h) => h.assetClass === c).length;

  function exportCsv() {
    // Descarga generada en el navegador; no pasa por ningún servidor.
    const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tenencia-nodo.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-3">
      <Tabs
        label="Clase de activo"
        value={filter}
        onChange={setFilter}
        items={[
          { id: "all", label: "Todos los activos", count: holdings.length },
          { id: "CEDEAR", label: "CEDEARs", count: count("CEDEAR") },
          { id: "Acción", label: "Acciones locales", count: count("Acción") },
          { id: "Bono", label: "Títulos públicos", count: count("Bono") },
        ]}
      />
      <div className={table.wrap}>
        <table className={`${table.table} min-w-[900px]`}>
          <thead>
            <tr>
              <th className={table.th}>Especie</th>
              <th className={`${table.th} text-right`}>Cantidad</th>
              <th className={`${table.th} text-right`}>PPC</th>
              <th className={`${table.th} text-right`}>Último</th>
              <th className={`${table.th} text-right`}>Valuación</th>
              <th className={`${table.th} text-right`}>Var. hoy</th>
              <th className={`${table.th} text-right`}>Ganancia total</th>
              <th className={`${table.th} text-right`}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((h) => (
              <tr key={h.symbol} className={table.row}>
                <td className={table.td}>
                  <span className="flex items-center gap-2">
                    <span className="flex size-8 items-center justify-center rounded bg-surface-lowest font-mono text-[11px] font-bold text-primary">{h.symbol.slice(0, 2)}</span>
                    <span>
                      <span className="flex items-center gap-1.5 font-mono text-sm font-semibold">
                        {h.symbol} <Badge className="py-0">{h.tag}</Badge>
                      </span>
                      <span className="text-[11px] text-fg-subtle">{h.name}</span>
                    </span>
                  </span>
                </td>
                <td className={`${table.td} text-right font-mono`}>{formatInteger(h.quantity)}</td>
                <td className={`${table.td} text-right font-mono`}>{money(h, h.avgPrice)}</td>
                <td className={`${table.td} text-right font-mono`}>{money(h, h.lastPrice)}</td>
                <td className={`${table.td} text-right font-mono font-semibold`}>{money(h, h.valuation)}</td>
                <td className={`${table.td} text-right font-mono`}>
                  <Change value={h.dayChangePct} />
                </td>
                <td className={`${table.td} text-right font-mono`}>
                  <span className={h.gain >= 0 ? "text-positive" : "text-negative"}>
                    {h.gain >= 0 ? "+" : "-"}
                    {money(h, Math.abs(h.gain))}
                  </span>
                  <span className="block text-[10px] text-fg-subtle">{formatPercent(h.gainPct)}</span>
                </td>
                <td className={`${table.td} text-right`}>
                  <span className="inline-flex gap-1">
                    <ButtonLink href={`/operar?especie=${h.symbol}`} size="sm" variant="buy">
                      Comprar
                    </ButtonLink>
                    <ButtonLink href={`/operar?especie=${h.symbol}&lado=venta`} size="sm" variant="secondary">
                      Vender
                    </ButtonLink>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-fg-subtle">
        <span>
          Mostrando {rows.length} de {holdings.length} posiciones · Valuación según cotizaciones CI / 24hs BYMA
        </span>
        <span className="flex gap-2">
          <ButtonLink href="/cuentas" variant="ghost" size="sm" icon="history">
            Movimientos históricos
          </ButtonLink>
          <button type="button" onClick={exportCsv} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-primary hover:bg-surface-high">
            Exportar CSV
          </button>
        </span>
      </div>
    </div>
  );
}
