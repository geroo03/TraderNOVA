"use client";

import { useMemo } from "react";
import { describeTime, sessionAt } from "@/lib/session";
import { useNow } from "@/lib/store/clock";
import { useSettingsStore } from "@/lib/store/hooks";

export interface MarketSession {
  open: boolean;
  /** "abre el lunes 11:00" / "cierra hoy 17:00" (vacío si la rueda es de demostración). */
  label: string;
  /** Rueda forzada abierta desde Ajustes (modo demostración). */
  forced: boolean;
}

/** Estado de la rueda según el reloj de Argentina o el modo "siempre abierta" de Ajustes. */
export function useMarketSession(): MarketSession {
  const now = useNow();
  const [settings] = useSettingsStore();
  const mode = settings.sessionMode;
  return useMemo(() => {
    if (mode === "always") return { open: true, label: "", forced: true };
    // Sin reloj (render del servidor) se asume abierta; el cliente corrige al hidratar.
    if (now === null) return { open: true, label: "", forced: false };
    const s = sessionAt(now);
    return { open: s.open, label: `${s.open ? "cierra" : "abre"} ${describeTime(s.nextChange, now)}`, forced: false };
  }, [now, mode]);
}
