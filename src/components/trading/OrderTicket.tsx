"use client";

import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { MsIcon } from "@/components/ui/MsIcon";
import { formatDecimal, formatInteger } from "@/lib/format";
import { maxAffordable, orderCosts, type Side } from "@/lib/order-costs";
import type { Instrument } from "@/lib/market-data";
import { portfolioSummary } from "@/lib/mock-data";

export type OrderType = "Límite" | "Mercado" | "Stop Límite";
export type Term = "CI" | "24hs" | "48hs";

export interface SubmittedOrder {
  symbol: string;
  side: Side;
  type: OrderType;
  term: Term;
  quantity: number;
  price: number;
  total: number;
}

interface OrderTicketProps {
  instrument: Instrument;
  initialSide?: Side;
  onSubmit: (order: SubmittedOrder) => void;
}

const inputCls = "w-full rounded-lg bg-surface-high px-3 py-2 font-mono text-sm text-fg outline-none focus-visible:ring-2 focus-visible:ring-primary";
const labelCls = "text-label uppercase text-fg-subtle";

/** Boleta de compra/venta con desglose de costos en vivo. No envía nada: es demo. */
export function OrderTicket({ instrument, initialSide = "buy", onSubmit }: OrderTicketProps) {
  const id = useId();
  const [side, setSide] = useState<Side>(initialSide);
  const [type, setType] = useState<OrderType>("Límite");
  const [term, setTerm] = useState<Term>("24hs");
  // Por defecto 500 nominales (como el Figma), sin superar lo que alcanza el disponible.
  const [qty, setQty] = useState(() => Math.max(1, Math.min(500, maxAffordable(portfolioSummary.buyingPower, instrument.price))));
  const [price, setPrice] = useState(instrument.price);
  const [confirm, setConfirm] = useState(true);
  const [pending, setPending] = useState<SubmittedOrder | null>(null);

  const available = portfolioSummary.buyingPower;
  const effectivePrice = type === "Mercado" ? instrument.price : price;
  const costs = orderCosts(qty, effectivePrice, side);
  const maxQty = maxAffordable(available, effectivePrice);
  const overBudget = side === "buy" && costs.total > available;
  const invalid = qty <= 0 || effectivePrice <= 0 || overBudget;
  const buy = side === "buy";
  const cur = instrument.currency === "USD" ? "U$S " : "$";

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (invalid) return;
    const order: SubmittedOrder = { symbol: instrument.symbol, side, type, term, quantity: qty, price: effectivePrice, total: costs.total };
    if (confirm) setPending(order);
    else onSubmit(order);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3" aria-label={`Boleta de ${instrument.symbol}`}>
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-surface-high p-1" role="radiogroup" aria-label="Operación">
        {(["buy", "sell"] as const).map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={side === s}
            onClick={() => setSide(s)}
            className={`flex items-center justify-center gap-1 rounded-md py-2 text-sm font-bold ${
              side === s ? (s === "buy" ? "bg-positive text-on-positive" : "bg-alert text-white") : "text-fg-muted"
            }`}
          >
            <MsIcon name={s === "buy" ? "add_circle" : "do_not_disturb_on"} size={16} />
            {s === "buy" ? "COMPRAR" : "VENDER"}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between rounded-lg bg-surface-high px-3 py-2">
        <span className={labelCls}>Disponible</span>
        <span className="font-mono text-xs font-semibold">
          ${formatDecimal(available)} <span className="text-fg-subtle">ARS</span>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1">
          <span className={labelCls}>Tipo de orden</span>
          <select value={type} onChange={(e) => setType(e.target.value as OrderType)} className={inputCls}>
            <option>Límite</option>
            <option>Mercado</option>
            <option>Stop Límite</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelCls}>Plazo</span>
          <select value={term} onChange={(e) => setTerm(e.target.value as Term)} className={inputCls}>
            <option value="CI">CI</option>
            <option value="24hs">24 hs</option>
            <option value="48hs">48 hs</option>
          </select>
        </label>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex justify-between">
          <label htmlFor={`${id}-qty`} className={labelCls}>
            Cantidad (nominales)
          </label>
          {buy && <span className="text-label text-fg-subtle">Máx. estimado: {formatInteger(maxQty)}</span>}
        </div>
        <input
          id={`${id}-qty`}
          type="number"
          inputMode="numeric"
          min={1}
          value={Number.isFinite(qty) ? qty : ""}
          onChange={(e) => setQty(Math.max(0, Math.floor(Number(e.target.value))))}
          className={inputCls}
        />
        {buy && (
          <div className="grid grid-cols-4 gap-1">
            {[25, 50, 75, 100].map((p) => (
              <button key={p} type="button" onClick={() => setQty(Math.floor((maxQty * p) / 100))} className="text-label rounded bg-surface-higher py-1 text-fg-muted hover:text-fg">
                {p}%
              </button>
            ))}
          </div>
        )}
      </div>

      {type !== "Mercado" && (
        <div className="flex flex-col gap-1">
          <div className="flex justify-between">
            <label htmlFor={`${id}-price`} className={labelCls}>
              Precio {type === "Stop Límite" ? "stop" : "límite"} ({instrument.currency})
            </label>
            <button type="button" onClick={() => setPrice(instrument.price)} className="text-label text-primary">
              Mejor {buy ? "venta" : "compra"}: {cur}
              {formatDecimal(instrument.price)}
            </button>
          </div>
          <div className="flex gap-1">
            <button type="button" aria-label="Bajar precio" onClick={() => setPrice((p) => Math.max(0, +(p - instrument.price * 0.001).toFixed(2)))} className="rounded-lg bg-surface-higher px-3">
              −
            </button>
            <input
              id={`${id}-price`}
              type="number"
              step="0.01"
              min={0}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className={`${inputCls} text-center`}
            />
            <button type="button" aria-label="Subir precio" onClick={() => setPrice((p) => +(p + instrument.price * 0.001).toFixed(2))} className="rounded-lg bg-surface-higher px-3">
              +
            </button>
          </div>
        </div>
      )}

      <dl className="flex flex-col gap-1 rounded-lg bg-surface-lowest p-3 font-mono text-xs">
        <p className="text-label pb-1 uppercase text-fg-subtle">Desglose de costos</p>
        {[
          ["Subtotal bruto", costs.gross],
          ["Comisión Nodo (0,15%)", costs.commission],
          ["Derechos BYMA (0,08%)", costs.marketRights],
          ["IVA (21% s/ aranceles)", costs.vat],
        ].map(([k, v]) => (
          <div key={k as string} className="flex justify-between">
            <dt className="text-fg-subtle">{k}</dt>
            <dd>
              {cur}
              {formatDecimal(v as number)}
            </dd>
          </div>
        ))}
        <div className="mt-1 flex justify-between border-t border-surface-higher pt-2 text-sm font-bold">
          <dt>{buy ? "Total a debitar" : "Neto a acreditar"}</dt>
          <dd className={buy ? "text-fg" : "text-positive"}>
            {cur}
            {formatDecimal(costs.total)}
          </dd>
        </div>
      </dl>

      {overBudget && (
        <p role="alert" className="text-xs text-negative">
          El total supera tu disponible. Reducí la cantidad o ingresá fondos.
        </p>
      )}

      <label className="flex items-center gap-2 text-xs text-fg-muted">
        <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} className="accent-primary-strong" />
        Pedir confirmación antes de enviar
      </label>

      <Button type="submit" variant={buy ? "buy" : "sell"} size="lg" disabled={invalid} icon="send">
        Enviar orden de {buy ? "compra" : "venta"} ({formatInteger(qty)} {instrument.symbol})
      </Button>

      {pending && (
        <div role="alertdialog" aria-label="Confirmar orden" className="rounded-lg border border-primary/40 bg-surface-high p-3 text-xs">
          <p className="font-semibold">
            ¿Confirmás {pending.side === "buy" ? "comprar" : "vender"} {formatInteger(pending.quantity)} {pending.symbol} a {cur}
            {formatDecimal(pending.price)}?
          </p>
          <p className="pt-1 text-fg-subtle">
            Total: {cur}
            {formatDecimal(pending.total)} · {pending.type} · {pending.term}
          </p>
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              variant={pending.side === "buy" ? "buy" : "sell"}
              onClick={() => {
                onSubmit(pending);
                setPending(null);
              }}
            >
              Confirmar
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setPending(null)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}
