"use client";

import { MsIcon } from "@/components/ui/MsIcon";
import { Button } from "@/components/ui/Button";
import { useTrading } from "@/components/trading/TradingProvider";
import { formatDecimal } from "@/lib/format";
import { SIM_START_ARS } from "@/lib/store/demo-data";

/** Interruptor de la barra superior para operar con saldo virtual. */
export function SimModeToggle() {
  const { simMode, setSimMode } = useTrading();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={simMode}
      aria-label="Modo simulación"
      onClick={() => setSimMode(!simMode)}
      className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold ${
        simMode ? "bg-primary-strong text-on-primary" : "bg-surface text-fg-muted hover:text-fg"
      }`}
    >
      <MsIcon name="psychology" size={16} />
      <span className="hidden sm:inline">Simulación</span>
      <span aria-hidden className={`relative h-3.5 w-6 rounded-full ${simMode ? "bg-on-primary/40" : "bg-surface-highest"}`}>
        <span className={`absolute top-0.5 size-2.5 rounded-full bg-fg transition-all ${simMode ? "left-3" : "left-0.5"}`} />
      </span>
    </button>
  );
}

/** Aviso persistente mientras el modo simulación está activo, para no confundirlo con operar en real. */
export function SimBanner() {
  const { simMode, setSimMode, account, resetSimulation } = useTrading();
  if (!simMode) return null;
  return (
    <div role="status" className="flex flex-wrap items-center justify-between gap-2 bg-primary-strong/15 px-4 py-2 text-xs">
      <p className="flex items-center gap-2 text-primary">
        <MsIcon name="psychology" size={16} />
        <span>
          <strong>Modo simulación.</strong> Saldo virtual: ${formatDecimal(account.availableArs)} de ${formatDecimal(SIM_START_ARS)} y U$S {formatDecimal(account.availableUsd)}. Nada llega al mercado.
        </span>
      </p>
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" icon="refresh" onClick={resetSimulation}>
          Reiniciar saldo
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setSimMode(false)}>
          Volver a real
        </Button>
      </div>
    </div>
  );
}
