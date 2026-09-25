"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { OrderBook } from "./OrderBook";
import { OrderTicket } from "./OrderTicket";
import { useTrading } from "./TradingProvider";
import type { TicketLevels } from "./useTicketLevels";
import { TradingChart } from "./chart/TradingChart";
import { FeedControls } from "@/components/market/FeedControls";
import { flashClass, useMarket } from "@/components/market/MarketProvider";
import { MsIcon } from "@/components/ui/MsIcon";
import { Badge } from "@/components/ui/Badge";
import { formatDecimal, formatPercent } from "@/lib/format";
import type { Instrument } from "@/lib/market-data";
import type { Side } from "@/lib/order-costs";
import { useSettingsStore } from "@/lib/store/hooks";

interface ChartWorkspaceProps {
  instrument: Instrument;
  levels: TicketLevels;
  onLevelsChange: (l: TicketLevels) => void;
  initialSide?: Side;
  onClose: () => void;
}

/**
 * Vista ampliada del gráfico (como el "Chart Trader" de las plataformas pro): ocupa toda la ventana,
 * con la boleta y el libro al costado para operar sin salir. Esc cierra; también puede pasar a
 * pantalla completa del navegador.
 */
export function ChartWorkspace({ instrument, levels, onLevelsChange, initialSide = "buy", onClose }: ChartWorkspaceProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const { submit, available, sellable, simMode, restriction } = useTrading();
  const { session, moves } = useMarket();
  const [settings] = useSettingsStore();
  const up = instrument.changePct >= 0;
  const cur = instrument.currency === "USD" ? "U$S " : "$";

  useEffect(() => {
    ref.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      // En pantalla completa del navegador, Esc primero sale de ella (lo maneja el navegador).
      if (e.key === "Escape" && !document.fullscreenElement) onClose();
    };
    const onFs = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("keydown", onKey);
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("fullscreenchange", onFs);
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    };
  }, [onClose]);

  function toggleFullscreen() {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    else void ref.current?.requestFullscreen?.().catch(() => {});
  }

  return createPortal(
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={`Gráfico ampliado de ${instrument.symbol}`}
      tabIndex={-1}
      className="fixed inset-0 z-40 flex flex-col gap-3 overflow-y-auto bg-bg p-3 outline-none lg:overflow-hidden"
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-lg font-bold">{instrument.symbol}</span>
          <span className="hidden text-sm text-fg-muted sm:inline">{instrument.name}</span>
          <span key={instrument.price} className={`rounded px-1 font-mono text-lg font-bold ${flashClass(moves[instrument.symbol])}`}>
            {cur}
            {formatDecimal(instrument.price)}
          </span>
          <span className={`font-mono text-sm font-semibold ${up ? "text-positive" : "text-negative"}`}>{formatPercent(instrument.changePct)}</span>
          {simMode && <Badge tone="primary">SIMULACIÓN</Badge>}
          {!session.open && !simMode && <Badge>Mercado cerrado · {session.label}</Badge>}
        </div>
        <div className="flex items-center gap-2">
          <FeedControls />
          <button type="button" onClick={toggleFullscreen} className="flex items-center gap-1 rounded-md bg-surface-high px-2 py-1.5 text-xs text-fg hover:bg-surface-higher">
            <MsIcon name={fullscreen ? "close_fullscreen" : "fullscreen"} size={16} />
            {fullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          </button>
          <button type="button" aria-label="Cerrar vista ampliada" onClick={onClose} className="rounded-md p-1.5 text-fg-muted hover:bg-surface-high hover:text-fg">
            <MsIcon name="close" size={20} />
          </button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="flex min-h-[60vh] min-w-0 flex-col rounded-xl bg-surface p-3 lg:min-h-0">
          <TradingChart instrument={instrument} levels={levels} onLevelsChange={onLevelsChange} className="h-full min-h-[55vh] lg:min-h-0" onExpand={onClose} expanded />
        </section>
        <aside className="flex min-h-0 flex-col gap-3 lg:overflow-y-auto">
          <section className="rounded-xl bg-surface p-3">
            <h2 className="pb-2 text-sm font-bold">Boleta</h2>
            <OrderTicket
              key={`${instrument.symbol}-${simMode}`}
              instrument={instrument}
              initialSide={initialSide}
              onSubmit={submit}
              available={available(instrument.currency)}
              sellable={sellable(instrument.symbol)}
              confirmByDefault={settings.confirmOrders}
              restriction={restriction}
              marketOpen={session.open}
              sessionLabel={session.label}
              simulated={simMode}
              levels={levels}
              onLevelsChange={onLevelsChange}
            />
          </section>
          <section className="rounded-xl bg-surface p-3">
            <h2 className="pb-2 text-sm font-bold">Libro de ofertas</h2>
            <OrderBook symbol={instrument.symbol} price={instrument.price} levels={6} compact onPriceClick={(price) => onLevelsChange({ ...levels, price, type: levels.type === "Mercado" ? "Límite" : levels.type })} />
          </section>
        </aside>
      </div>
    </div>,
    document.body,
  );
}
