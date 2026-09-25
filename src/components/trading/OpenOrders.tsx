import { Badge, StatusDot } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { table } from "@/components/ui/Page";
import { formatDecimal, formatInteger } from "@/lib/format";

export interface LiveOrder {
  id: string;
  time: string;
  symbol: string;
  side: "buy" | "sell";
  type: string;
  term: string;
  quantity: number;
  filled: number;
  price: number;
  status: "working" | "partial" | "executed" | "cancelled";
}

const statusView: Record<LiveOrder["status"], { label: string; tone: "primary" | "positive" | "neutral" | "negative" }> = {
  working: { label: "Enviada a BYMA", tone: "primary" },
  partial: { label: "Parcialmente ejecutada", tone: "primary" },
  executed: { label: "Ejecutada", tone: "positive" },
  cancelled: { label: "Cancelada", tone: "negative" },
};

export function OpenOrders({ orders, onCancel }: { orders: LiveOrder[]; onCancel?: (id: string) => void }) {
  if (orders.length === 0) {
    return <p className="rounded-lg bg-surface-high p-6 text-center text-xs text-fg-subtle">No hay órdenes en esta rueda.</p>;
  }
  return (
    <div className={table.wrap}>
      <table className={`${table.table} min-w-[820px]`}>
        <thead>
          <tr>
            {["ID orden", "Hora", "Especie", "Operación", "Tipo · Plazo", "Cant.", "Ejecutada", "Precio", "Estado", ""].map((h) => (
              <th key={h} className={table.th}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => {
            const s = statusView[o.status];
            const open = o.status === "working" || o.status === "partial";
            return (
              <tr key={o.id} className={table.row}>
                <td className={`${table.td} font-mono text-fg-subtle`}>{o.id}</td>
                <td className={`${table.td} font-mono`}>{o.time}</td>
                <td className={`${table.td} font-mono font-semibold`}>{o.symbol}</td>
                <td className={table.td}>
                  <Badge tone={o.side === "buy" ? "positive" : "negative"}>{o.side === "buy" ? "COMPRA" : "VENTA"}</Badge>
                </td>
                <td className={`${table.td} text-fg-subtle`}>
                  {o.type} · {o.term}
                </td>
                <td className={`${table.td} text-right font-mono`}>{formatInteger(o.quantity)}</td>
                <td className={`${table.td} text-right font-mono`}>{formatInteger(o.filled)}</td>
                <td className={`${table.td} text-right font-mono`}>${formatDecimal(o.price)}</td>
                <td className={table.td}>
                  <Badge tone={s.tone} pill>
                    <StatusDot tone={s.tone} /> {s.label}
                  </Badge>
                </td>
                <td className={`${table.td} text-right`}>
                  {open && onCancel && (
                    <Button size="sm" variant="danger" icon="close" onClick={() => onCancel(o.id)}>
                      Cancelar
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
