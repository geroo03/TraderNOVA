import { formatDecimal, formatInteger } from "@/lib/format";
import { orderBook } from "@/lib/market-data";

interface OrderBookProps {
  symbol: string;
  price: number;
  levels?: number;
  compact?: boolean;
  /** Clic en un nivel: carga ese precio en la boleta (como el DOM de las plataformas pro). */
  onPriceClick?: (price: number) => void;
}

/** Libro nivel 2: puntas de venta arriba (rojo), compra abajo (verde), barra de profundidad acumulada. */
export function OrderBook({ symbol, price, levels = 5, compact = false, onPriceClick }: OrderBookProps) {
  const { bids, asks, spread } = orderBook(symbol, price, levels);
  const maxTotal = Math.max(asks[0]?.total ?? 1, bids[bids.length - 1]?.total ?? 1);
  const row = `${compact ? "py-0.5" : "py-1"} ${onPriceClick ? "w-full cursor-pointer text-left hover:bg-surface-higher" : ""}`;
  const Row = onPriceClick ? "button" : "div";
  const rowProps = (p: number) =>
    onPriceClick ? { type: "button" as const, onClick: () => onPriceClick(Math.round(p * 100) / 100), "aria-label": `Usar precio ${formatDecimal(p)}` } : {};

  return (
    <div className="font-mono text-[11px]">
      <div className="text-label grid grid-cols-3 px-2 pb-1 uppercase text-fg-subtle">
        <span>Precio</span>
        <span className="text-right">Cant.</span>
        <span className="text-right">Acum.</span>
      </div>
      {asks.map((l) => (
        <Row key={`a${l.price}`} {...rowProps(l.price)} className={`relative grid grid-cols-3 px-2 ${row}`}>
          <span aria-hidden className="absolute inset-y-0 right-0 bg-alert/10" style={{ width: `${(l.total / maxTotal) * 100}%` }} />
          <span className="relative text-negative">${formatDecimal(l.price)}</span>
          <span className="relative text-right">{formatInteger(l.qty)}</span>
          <span className="relative text-right text-fg-subtle">{formatInteger(l.total)}</span>
        </Row>
      ))}
      <div className="my-1 flex items-center justify-between rounded bg-surface-high px-2 py-1">
        <span className="font-semibold text-fg">${formatDecimal(price)}</span>
        <span className="text-label text-fg-subtle">Spread ${formatDecimal(spread)}</span>
      </div>
      {bids.map((l) => (
        <Row key={`b${l.price}`} {...rowProps(l.price)} className={`relative grid grid-cols-3 px-2 ${row}`}>
          <span aria-hidden className="absolute inset-y-0 right-0 bg-positive/10" style={{ width: `${(l.total / maxTotal) * 100}%` }} />
          <span className="relative text-positive">${formatDecimal(l.price)}</span>
          <span className="relative text-right">{formatInteger(l.qty)}</span>
          <span className="relative text-right text-fg-subtle">{formatInteger(l.total)}</span>
        </Row>
      ))}
      {onPriceClick && <p className="text-label px-2 pt-1 text-fg-subtle">Tocá un precio para cargarlo en la boleta.</p>}
    </div>
  );
}
