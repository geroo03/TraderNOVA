import { describe, expect, it } from "vitest";
import { bollinger, ema, heikinAshi, macd, niceTicks, rsi, sma, vwap } from "./indicators";
import { candleTime, opensSession, timeLabel } from "./chart-time";

const up = Array.from({ length: 40 }, (_, i) => 100 + i);

describe("indicadores", () => {
  it("SMA y EMA empiezan cuando hay datos suficientes", () => {
    expect(sma([1, 2, 3, 4], 2)).toEqual([null, 1.5, 2.5, 3.5]);
    const e = ema([1, 2, 3, 4, 5], 3);
    expect(e.slice(0, 2)).toEqual([null, null]);
    expect(e[2]).toBe(2);
    expect(e[3]).toBeCloseTo(3);
  });

  it("Bollinger: banda media = SMA y bandas simétricas", () => {
    const b = bollinger([1, 2, 3, 4, 5], 5, 2)[4]!;
    expect(b.mid).toBe(3);
    expect(b.upper - b.mid).toBeCloseTo(b.mid - b.lower);
    expect(b.upper - b.mid).toBeCloseTo(2 * Math.sqrt(2));
  });

  it("RSI: 100 en una suba sin pausas y ~0 en una baja", () => {
    expect(rsi(up)[39]).toBe(100);
    expect(rsi([...up].reverse())[39]).toBeCloseTo(0);
    expect(rsi(up)[13]).toBeNull();
  });

  it("MACD positivo en tendencia alcista, con señal e histograma", () => {
    const m = macd(up).at(-1)!;
    expect(m.macd).toBeGreaterThan(0);
    expect(m.signal).not.toBeNull();
    expect(m.hist).toBeCloseTo(m.macd - (m.signal as number));
    expect(macd(up)[24]).toBeNull();
  });

  it("VWAP se reinicia al abrir cada rueda", () => {
    const c = [
      { open: 1, high: 1, low: 1, close: 1, volume: 10 },
      { open: 3, high: 3, low: 3, close: 3, volume: 10 },
      { open: 9, high: 9, low: 9, close: 9, volume: 10 },
    ];
    expect(vwap(c, (i) => i === 0 || i === 2)).toEqual([1, 2, 9]);
  });

  it("Heikin Ashi promedia la vela", () => {
    const h = heikinAshi([{ open: 10, high: 14, low: 8, close: 12, volume: 1 }])[0];
    expect(h.close).toBe(11);
    expect(h.open).toBe(11);
  });

  it("niceTicks devuelve valores redondos dentro del rango", () => {
    expect(niceTicks(4_812, 4_896, 5)).toEqual([4_820, 4_840, 4_860, 4_880]);
    expect(niceTicks(58.1, 58.9, 4)).toEqual([58.2, 58.4, 58.6, 58.8]);
  });
});

describe("tiempo de las velas", () => {
  it("la última vela es 15:45 de la rueda de referencia y las anteriores retroceden por rueda", () => {
    expect(candleTime("15m", 99, 100)).toEqual({ dayBack: 0, minute: 285 });
    expect(timeLabel("15m", 99, 100)).toBe("15:45");
    // 19 velas atrás es la apertura (11:00) de la misma rueda: se etiqueta con la fecha.
    expect(timeLabel("15m", 80, 100)).toBe("18 Feb");
    expect(candleTime("15m", 79, 100)).toEqual({ dayBack: 1, minute: 345 });
    expect(opensSession("15m", 80, 100)).toBe(true);
  });

  it("en diario saltea fines de semana", () => {
    // 18/02/2025 es martes: 2 días hábiles antes es el viernes 14.
    expect(timeLabel("1D", 97, 100)).toBe("14 Feb");
  });
});
