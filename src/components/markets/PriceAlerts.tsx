"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { MsIcon } from "@/components/ui/MsIcon";
import { useToast } from "@/components/ui/Toast";
import { formatDecimal } from "@/lib/format";
import { newId } from "@/lib/download";
import { useAlertsStore } from "@/lib/store/hooks";

/** Alertas de precio por especie: avisan (toast + notificación) cuando el feed cruza el nivel. */
export function PriceAlerts({ symbol, price }: { symbol: string; price: number }) {
  const toast = useToast();
  const [alerts, setAlerts] = useAlertsStore();
  const [level, setLevel] = useState(() => Math.round(price * 1.01 * 100) / 100);
  const mine = alerts.filter((a) => a.symbol === symbol);
  const direction = level >= price ? "above" : "below";

  function add() {
    if (!(level > 0)) return;
    setAlerts((prev) => [{ id: newId("AL"), symbol, direction, price: level, active: true }, ...prev]);
    toast({ title: "Alerta creada", text: `${symbol} ${direction === "above" ? "sube a" : "baja a"} ${formatDecimal(level)}.`, tone: "primary" });
  }

  return (
    <div className="rounded-lg bg-surface-high p-2">
      <p className="text-label flex items-center gap-1 pb-1 uppercase text-fg-subtle">
        <MsIcon name="notifications_active" size={12} /> Alertas de precio
      </p>
      <div className="flex gap-1">
        <label className="sr-only" htmlFor={`alert-${symbol}`}>
          Precio de la alerta
        </label>
        <input
          id={`alert-${symbol}`}
          type="number"
          step="0.01"
          value={level}
          onChange={(e) => setLevel(Number(e.target.value))}
          className="min-w-0 flex-1 rounded bg-surface-lowest px-2 py-1 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
        <Button size="sm" variant="secondary" onClick={add}>
          {direction === "above" ? "Si sube a" : "Si baja a"}
        </Button>
      </div>
      {mine.length > 0 && (
        <ul className="flex flex-col gap-1 pt-2">
          {mine.map((a) => (
            <li key={a.id} className="flex items-center justify-between text-[11px]">
              <span className={a.active ? "text-fg" : "text-fg-subtle line-through"}>
                {a.direction === "above" ? "≥" : "≤"} {formatDecimal(a.price)} {a.triggeredAt && `· disparada ${a.triggeredAt}`}
              </span>
              <button type="button" aria-label="Eliminar alerta" onClick={() => setAlerts((prev) => prev.filter((x) => x.id !== a.id))} className="text-fg-subtle hover:text-negative">
                <MsIcon name="close" size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
