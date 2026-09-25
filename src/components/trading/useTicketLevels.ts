"use client";

import { useState } from "react";
import type { Instrument } from "@/lib/market-data";
import type { Bracket } from "@/lib/bracket";
import type { OrderType } from "./OrderTicket";

/** Niveles de la boleta que también se editan desde el gráfico (arrastrando líneas). */
export interface TicketLevels {
  type: OrderType;
  price: number;
  bracket: Bracket | null;
}

const initial = (instrument: Instrument): TicketLevels => ({ type: "Límite", price: instrument.price, bracket: null });

/** Estado compartido entre boleta y gráfico. Se reinicia al cambiar de especie. */
export function useTicketLevels(instrument: Instrument) {
  const [state, setState] = useState({ symbol: instrument.symbol, levels: initial(instrument) });
  // Ajuste de estado durante el render (patrón recomendado por React) en vez de un efecto.
  if (state.symbol !== instrument.symbol) {
    const next = { symbol: instrument.symbol, levels: initial(instrument) };
    setState(next);
    return [next.levels, setLevelsFor(setState, instrument.symbol)] as const;
  }
  return [state.levels, setLevelsFor(setState, instrument.symbol)] as const;
}

function setLevelsFor(setState: (s: { symbol: string; levels: TicketLevels }) => void, symbol: string) {
  return (levels: TicketLevels) => setState({ symbol, levels });
}
