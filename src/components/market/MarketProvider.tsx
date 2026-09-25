"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { instruments, tape as seedTape, type Execution, type Instrument } from "@/lib/market-data";
import { nowTime } from "@/lib/download";
import { useSimModeStore } from "@/lib/store/hooks";
import { useMarketSession, type MarketSession } from "./useSession";

export type FeedSpeed = 1 | 5 | 20;

interface MarketState {
  prices: Record<string, number>;
  /** Instrumento con precio y variación en vivo. */
  quote: (symbol: string) => Instrument;
  quotes: Instrument[];
  tape: (symbol: string) => Execution[];
  speed: FeedSpeed;
  setSpeed: (s: FeedSpeed) => void;
  paused: boolean;
  setPaused: (p: boolean) => void;
  /** Hora de la última actualización (vacía antes del primer tick). */
  lastTick: string;
  /** Dirección del último movimiento por especie, para el destello de color. */
  moves: Record<string, 1 | -1 | 0>;
  session: MarketSession;
  /** El feed se mueve: rueda abierta, o modo simulación (que opera 24/7). */
  live: boolean;
}

const MarketContext = createContext<MarketState | null>(null);

const basePrices = Object.fromEntries(instruments.map((i) => [i.symbol, i.price]));
const prevClose = Object.fromEntries(instruments.map((i) => [i.symbol, i.price / (1 + i.changePct / 100)]));
const INTERVAL: Record<FeedSpeed, number> = { 1: 2_000, 5: 1_000, 20: 500 };
const VOL: Record<FeedSpeed, number> = { 1: 0.0012, 5: 0.003, 20: 0.007 };

/** Caudal inicial: el de la semilla, reescalado al precio de cada especie. */
function initialTape(symbol: string): Execution[] {
  const k = basePrices[symbol] / 4_850;
  return seedTape.map((t) => ({ ...t, price: Math.round(t.price * k * 100) / 100 }));
}

/** Un paso del feed: caminata aleatoria con reversión suave al precio de referencia. */
function tick(prev: Record<string, number>, vol: number, time: string) {
  const next: Record<string, number> = {};
  const dir: Record<string, 1 | -1 | 0> = {};
  const trades: Record<string, Execution> = {};
  for (const [s, p] of Object.entries(prev)) {
    // Solo se mueve una parte de las especies en cada tick, como en una rueda real.
    if (Math.random() > 0.55) {
      next[s] = p;
      dir[s] = 0;
      continue;
    }
    const shock = (Math.random() - 0.5) * 2 * vol;
    const revert = ((basePrices[s] - p) / basePrices[s]) * 0.03;
    const v = Math.max(0.01, Math.round(p * (1 + shock + revert) * 100) / 100);
    next[s] = v;
    dir[s] = v > p ? 1 : v < p ? -1 : 0;
    trades[s] = { time, qty: 50 + Math.round(Math.random() * 30) * 50, price: v, side: v >= p ? "buy" : "sell" };
  }
  return { next, dir, trades };
}

/**
 * Feed de precios simulado: caminata aleatoria con reversión a la media, solo en el cliente.
 * El primer render usa los precios estáticos, así servidor y cliente coinciden.
 */
export function MarketProvider({ children }: { children: ReactNode }) {
  const [prices, setPrices] = useState(basePrices);
  const [tapes, setTapes] = useState<Record<string, Execution[]>>({});
  const [moves, setMoves] = useState<Record<string, 1 | -1 | 0>>({});
  const [speed, setSpeed] = useState<FeedSpeed>(1);
  const [paused, setPaused] = useState(false);
  const [lastTick, setLastTick] = useState("");

  const pricesRef = useRef(basePrices);
  const session = useMarketSession();
  const [simMode] = useSimModeStore();
  const live = !paused && (session.open || simMode);

  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => {
      const time = nowTime();
      const { next, dir, trades } = tick(pricesRef.current, VOL[speed], time);
      pricesRef.current = next;
      setPrices(next);
      setMoves(dir);
      setTapes((t) => {
        const out = { ...t };
        for (const [s, e] of Object.entries(trades)) out[s] = [e, ...(t[s] ?? initialTape(s))].slice(0, 14);
        return out;
      });
      setLastTick(time);
    }, INTERVAL[speed]);
    return () => clearInterval(id);
  }, [live, speed]);

  const value = useMemo<MarketState>(() => {
    const quote = (symbol: string): Instrument => {
      const base = instruments.find((i) => i.symbol === symbol) ?? instruments[0];
      const price = prices[base.symbol] ?? base.price;
      return { ...base, price, changePct: (price / prevClose[base.symbol] - 1) * 100 };
    };
    return {
      prices,
      quote,
      quotes: instruments.map((i) => quote(i.symbol)),
      tape: (symbol) => tapes[symbol] ?? initialTape(symbol),
      speed,
      setSpeed,
      paused,
      setPaused,
      lastTick,
      moves,
      session,
      live,
    };
  }, [prices, tapes, speed, paused, lastTick, moves, session, live]);

  return <MarketContext value={value}>{children}</MarketContext>;
}

/** Fuera del proveedor (landing, login, staff) devuelve los precios estáticos. */
const staticMarket: MarketState = {
  prices: basePrices,
  quote: (s) => instruments.find((i) => i.symbol === s) ?? instruments[0],
  quotes: instruments,
  tape: initialTape,
  speed: 1,
  setSpeed: () => {},
  paused: true,
  setPaused: () => {},
  lastTick: "",
  moves: {},
  session: { open: true, label: "", forced: false },
  live: false,
};

export function useMarket(): MarketState {
  return useContext(MarketContext) ?? staticMarket;
}

/** Clase de destello según el último movimiento del precio. */
export function flashClass(dir: 1 | -1 | 0 | undefined): string {
  return dir === 1 ? "animate-flash-up" : dir === -1 ? "animate-flash-down" : "";
}
