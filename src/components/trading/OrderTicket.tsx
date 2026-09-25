"use client";

import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { MsIcon } from "@/components/ui/MsIcon";
import { formatDecimal, formatInteger } from "@/lib/format";
import { maxAffordable, type Side } from "@/lib/order-costs";
import { orderValue, priceDivisor } from "@/lib/orders";
import type { Instrument } from "@/lib/market-data";
import {
  BRACKET_TEMPLATES,
  MAX_PRICE_DEVIATION,
  bracketFromPct,
  bracketRisk,
  defaultBracket,
  priceDeviation,
  validateBracket,
  type Bracket,
} from "@/lib/bracket";
import type { TicketLevels } from "./useTicketLevels";

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
  bracket?: Bracket;
}

interface OrderTicketProps {
  instrument: Instrument;
  initialSide?: Side;
  onSubmit: (order: SubmittedOrder) => void;
  /** Disponible para operar en la moneda de la especie (saldo real o virtual según el modo). */
  available: number;
  /** Nominales que se pueden vender (tenencia menos ventas abiertas). */
  sellable: number;
  /** Valor inicial del check "pedir confirmación" (preferencia del usuario). */
  confirmByDefault?: boolean;
  simulated?: boolean;
  /** Tipo, precio y stop/target: controlados por el padre para sincronizarlos con el gráfico. */
  levels: TicketLevels;
  onLevelsChange: (levels: TicketLevels) => void;
}

const inputCls = "w-full rounded-lg bg-surface-high px-3 py-2 font-mono text-sm text-fg outline-none focus-visible:ring-2 focus-visible:ring-primary";
const labelCls = "text-label uppercase text-fg-subtle";

/** Boleta de compra/venta con desglose de costos en vivo. No envía nada: es demo. */
export function OrderTicket({
  instrument,
  initialSide = "buy",
  onSubmit,
  available,
  sellable,
  confirmByDefault = true,
  simulated = false,
  levels,
  onLevelsChange,
}: OrderTicketProps) {
  const id = useId();
  const [side, setSide] = useState<Side>(initialSide);
  const [term, setTerm] = useState<Term>("24hs");
  // Por defecto 500 nominales (como el Figma), sin superar lo que alcanza el disponible.
  const divisor = priceDivisor(instrument.symbol);
  const [qty, setQty] = useState(() =>
    initialSide === "sell" ? Math.max(1, Math.min(500, sellable)) : Math.max(1, Math.min(500 * divisor, maxAffordable(available, instrument.price / divisor))),
  );
  const [confirm, setConfirm] = useState(confirmByDefault);
  const [pending, setPending] = useState<SubmittedOrder | null>(null);

  const { type, price, bracket } = levels;
  const setType = (t: OrderType) => onLevelsChange({ ...levels, type: t });
  const setPrice = (p: number) => onLevelsChange({ ...levels, price: p });
  const setBracket = (b: Bracket | null) => onLevelsChange({ ...levels, bracket: b });

  const effectivePrice = type === "Mercado" ? instrument.price : price;
  const costs = orderValue(instrument.symbol, qty, effectivePrice, side);
  const maxQty = side === "buy" ? maxAffordable(available, effectivePrice / divisor) : sellable;
  const overBudget = side === "buy" && costs.total > available;
  const overHolding = side === "sell" && qty > sellable;
  const bracketError = bracket ? validateBracket(side, effectivePrice, bracket) : null;
  const rawRisk = bracket && !bracketError ? bracketRisk(qty, effectivePrice, bracket) : null;
  // Bonos: el riesgo se expresa sobre el monto (cada 100 VN), no sobre el precio.
  const risk = rawRisk && { ...rawRisk, maxLoss: rawRisk.maxLoss / divisor, maxGain: rawRisk.maxGain / divisor };
  // Un precio muy alejado del mercado suele ser un error de tipeo: se avisa y se exige confirmar.
  const farFromMarket = type !== "Mercado" && priceDeviation(price, instrument.price) > MAX_PRICE_DEVIATION;
  const invalid = qty <= 0 || effectivePrice <= 0 || overBudget || overHolding || !!bracketError;
  const buy = side === "buy";
  const cur = instrument.currency === "USD" ? "U$S " : "$";

  function changeSide(s: Side) {
    setSide(s);
    // Stop y target protegen una compra: al pasar a venta se quitan.
    if (s === "sell" && bracket) setBracket(null);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (invalid) return;
    const order: SubmittedOrder = {
      symbol: instrument.symbol,
      side,
      type,
      term,
      quantity: qty,
      price: effectivePrice,
      total: costs.total,
      ...(bracket ? { bracket } : {}),
    };
    if (confirm || farFromMarket) setPending(order);
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
            onClick={() => changeSide(s)}
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
        <span className={`${labelCls} flex items-center gap-1 whitespace-nowrap`}>
          Disponible {simulated && <Badge tone="primary">SIM</Badge>}
        </span>
        <span className="font-mono text-xs font-semibold">
          {cur}
          {formatDecimal(available)} <span className="text-fg-subtle">{instrument.currency}</span>
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
          <span className="text-label text-fg-subtle">
            {buy ? "Máx. estimado" : "Tenencia vendible"}: {formatInteger(maxQty)}
          </span>
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
        {maxQty > 0 && (
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
            <button type="button" aria-label="Bajar precio" onClick={() => setPrice(Math.max(0, +(price - instrument.price * 0.001).toFixed(2)))} className="rounded-lg bg-surface-higher px-3">
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
            <button type="button" aria-label="Subir precio" onClick={() => setPrice(+(price + instrument.price * 0.001).toFixed(2))} className="rounded-lg bg-surface-higher px-3">
              +
            </button>
          </div>
        </div>
      )}

      {farFromMarket && (
        <p role="status" className="flex items-start gap-1.5 rounded-lg bg-alert/10 p-2 text-xs text-negative">
          <MsIcon name="warning" size={14} className="mt-px shrink-0" />
          El precio está {formatDecimal(priceDeviation(price, instrument.price) * 100)}% lejos del mercado. Revisalo: se pedirá confirmación.
        </p>
      )}

      {buy && (
      <fieldset className="flex flex-col gap-2 rounded-lg bg-surface-high p-3">
        <label className="flex items-center justify-between gap-2 text-xs font-semibold">
          <span className="flex items-center gap-1.5">
            <MsIcon name="shield" size={14} className="text-primary" />
            Stop loss y take profit
          </span>
          <input
            type="checkbox"
            checked={!!bracket}
            onChange={(e) => setBracket(e.target.checked ? defaultBracket(side, effectivePrice) : null)}
            className="accent-primary-strong"
          />
        </label>
        {bracket && (
          <>
            <label className="flex flex-col gap-1">
              <span className={labelCls}>Plantilla</span>
              <select
                value=""
                onChange={(e) => {
                  const t = BRACKET_TEMPLATES.find((x) => x.id === e.target.value);
                  if (t) setBracket(bracketFromPct(side, effectivePrice, t.stopPct, t.targetPct));
                }}
                className={inputCls}
              >
                <option value="" disabled>
                  Aplicar plantilla…
                </option>
                {BRACKET_TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1">
                <span className={`${labelCls} text-negative`}>Stop loss</span>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={bracket.stop}
                  onChange={(e) => setBracket({ ...bracket, stop: Number(e.target.value) })}
                  className={inputCls}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className={`${labelCls} text-positive`}>Take profit</span>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={bracket.target}
                  onChange={(e) => setBracket({ ...bracket, target: Number(e.target.value) })}
                  className={inputCls}
                />
              </label>
            </div>
            {bracketError ? (
              <p role="alert" className="text-xs text-negative">
                {bracketError}
              </p>
            ) : (
              risk && (
                <dl className="grid grid-cols-3 gap-1 font-mono text-[11px]">
                  <div>
                    <dt className="text-fg-subtle">Pérdida máx.</dt>
                    <dd className="text-negative">
                      {cur}
                      {formatDecimal(risk.maxLoss)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-fg-subtle">Ganancia obj.</dt>
                    <dd className="text-positive">
                      {cur}
                      {formatDecimal(risk.maxGain)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-fg-subtle">Riesgo/benef.</dt>
                    <dd>1 : {formatDecimal(risk.ratio)}</dd>
                  </div>
                </dl>
              )
            )}
            <p className="text-label text-fg-subtle">Tip: también podés arrastrar las líneas en el gráfico.</p>
          </>
        )}
      </fieldset>
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
      {overHolding && (
        <p role="alert" className="text-xs text-negative">
          {sellable === 0 ? `No tenés ${instrument.symbol} disponible para vender.` : `Solo podés vender hasta ${formatInteger(sellable)} nominales.`}
        </p>
      )}

      <label className="flex items-center gap-2 text-xs text-fg-muted">
        <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} className="accent-primary-strong" />
        Pedir confirmación antes de enviar
      </label>

      <Button type="submit" variant={buy ? "buy" : "sell"} size="lg" disabled={invalid} icon="send">
        {simulated ? "Simular" : "Enviar orden de"} {buy ? "compra" : "venta"} ({formatInteger(qty)} {instrument.symbol})
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
            {simulated && " · Simulada"}
          </p>
          {pending.bracket && (
            <p className="pt-1 font-mono text-fg-subtle">
              <span className="text-negative">SL {formatDecimal(pending.bracket.stop)}</span> ·{" "}
              <span className="text-positive">TP {formatDecimal(pending.bracket.target)}</span>
            </p>
          )}
          {farFromMarket && <p className="pt-1 text-negative">Atención: el precio está lejos del mercado.</p>}
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
