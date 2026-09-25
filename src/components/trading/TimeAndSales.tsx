import { formatDecimal, formatInteger } from "@/lib/format";
import { tape } from "@/lib/market-data";

/** Caudal de operaciones (time & sales). */
export function TimeAndSales() {
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
        {tape.map((t) => (
          <tr key={t.time + t.qty}>
            <td className="px-2 py-1 text-fg-subtle">{t.time}</td>
            <td className="px-2 py-1 text-right">{formatInteger(t.qty)}</td>
            <td className={`px-2 py-1 text-right ${t.side === "buy" ? "text-positive" : "text-negative"}`}>${formatDecimal(t.price)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
