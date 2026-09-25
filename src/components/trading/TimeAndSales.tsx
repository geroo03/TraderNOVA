"use client";

import { useMarket } from "@/components/market/MarketProvider";
import { formatDecimal, formatInteger } from "@/lib/format";

/** Caudal de operaciones (time & sales) de la especie, alimentado por el feed en vivo. */
export function TimeAndSales({ symbol, rows = 8 }: { symbol: string; rows?: number }) {
  const { tape } = useMarket();
  return (
    <table className="w-full font-mono text-[11px]">
      <thead>
        <tr className="text-label uppercase text-fg-subtle">
          <th className="px-2 pb-1 text-left font-semibold">Hora</th>
          <th className="px-2 pb-1 text-right font-semibold">Cant.</th>
          <th className="px-2 pb-1 text-right font-semibold">Precio</th>
        </tr>
      </thead>
      <tbody>
        {tape(symbol)
          .slice(0, rows)
          .map((t, i) => (
            <tr key={`${t.time}-${t.qty}-${i}`} className={i === 0 ? (t.side === "buy" ? "animate-flash-up" : "animate-flash-down") : undefined}>
              <td className="px-2 py-1 text-fg-subtle">{t.time}</td>
              <td className="px-2 py-1 text-right">{formatInteger(t.qty)}</td>
              <td className={`px-2 py-1 text-right ${t.side === "buy" ? "text-positive" : "text-negative"}`}>${formatDecimal(t.price)}</td>
            </tr>
          ))}
      </tbody>
    </table>
  );
}
