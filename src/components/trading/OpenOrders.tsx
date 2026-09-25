import { Badge, StatusDot } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { table } from "@/components/ui/Page";
import { formatDecimal, formatInteger } from "@/lib/format";
import { isOpenOrder, type LiveOrder } from "@/lib/trading";

export type { LiveOrder } from "@/lib/trading";

const statusView: Record<LiveOrder["status"], { label: string; tone: "primary" | "positive" | "neutral" | "negative" }> = {
  working: { label: "Enviada a BYMA", tone: "primary" },
  partial: { label: "Parcialmente ejecutada", tone: "primary" },
  executed: { label: "Ejecutada", tone: "positive" },
  cancelled: { label: "Cancelada", tone: "negative" },
};

const bracketView = {
  active: { label: "SL/TP activos", tone: "primary" },
  stopped: { label: "Salió por stop", tone: "negative" },
  target: { label: "Salió por target", tone: "positive" },
  cancelled: { label: "SL/TP desactivados", tone: "neutral" },
} as const;

interface OpenOrdersProps {
  orders: LiveOrder[];
  onCancel?: (id: string) => void;
  onCancelBracket?: (id: string) => void;
}

export function OpenOrders({ orders, onCancel, onCancelBracket }: OpenOrdersProps) {
  if (orders.length === 0) {
    return <p className="rounded-lg bg-surface-high p-6 text-center text-xs text-fg-subtle">No hay órdenes en esta rueda.</p>;
  }
  return (
    <div className={table.wrap}>
      <table className={`${table.table} min-w-[860px]`}>
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
            const cur = o.currency === "USD" ? "U$S " : "$";
            return (
              <tr key={o.id} className={table.row}>
                <td className={`${table.td} font-mono text-fg-subtle`}>{o.id}</td>
                <td className={`${table.td} font-mono`}>{o.time}</td>
                <td className={`${table.td} font-mono font-semibold`}>
                  {o.symbol} {o.simulated && <Badge tone="muted">SIM</Badge>}
                </td>
                <td className={table.td}>
                  <Badge tone={o.side === "buy" ? "positive" : "negative"}>{o.side === "buy" ? "COMPRA" : "VENTA"}</Badge>
                </td>
                <td className={`${table.td} text-fg-subtle`}>
                  {o.type} · {o.term}
                  {o.bracket && (
                    <span className="block font-mono text-[11px]">
                      <span className="text-negative">SL {formatDecimal(o.bracket.stop)}</span> · <span className="text-positive">TP {formatDecimal(o.bracket.target)}</span>
                      {o.bracketState && <span className="block text-fg-subtle">{bracketView[o.bracketState].label}</span>}
                    </span>
                  )}
                </td>
                <td className={`${table.td} text-right font-mono`}>{formatInteger(o.quantity)}</td>
                <td className={`${table.td} text-right font-mono`}>{formatInteger(o.filled)}</td>
                <td className={`${table.td} text-right font-mono`}>
                  {cur}
                  {formatDecimal(o.price)}
                </td>
                <td className={table.td}>
                  <Badge tone={s.tone} pill>
                    <StatusDot tone={s.tone} /> {s.label}
                  </Badge>
                </td>
                <td className={`${table.td} text-right`}>
                  {isOpenOrder(o) && onCancel && (
                    <Button size="sm" variant="danger" icon="close" onClick={() => onCancel(o.id)}>
                      Cancelar
                    </Button>
                  )}
                  {o.bracketState === "active" && onCancelBracket && (
                    <Button size="sm" variant="secondary" onClick={() => onCancelBracket(o.id)}>
                      Quitar SL/TP
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
