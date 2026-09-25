import { describe, expect, it } from "vitest";
import { formatDecimal, formatPercent, splitAmount } from "./format";
import { orderValue } from "./orders";
import { valueHolding } from "./portfolio";
import { movingAverage, toPoints } from "./chart-math";
import { walk } from "./random";

describe("format (es-AR)", () => {
  it("usa punto de miles y coma decimal", () => {
    expect(formatDecimal(24_850_340)).toBe("24.850.340,00");
  });
  it("muestra el signo en porcentajes", () => {
    expect(formatPercent(2.14)).toBe("+2,14%");
    expect(formatPercent(-0.2, 1)).toBe("-0,2%");
  });
  it("separa enteros y decimales para los KPIs", () => {
    expect(splitAmount(482_150)).toEqual({ integer: "482.150", decimals: ",00" });
  });
});

describe("montos de bonos (cotizan cada 100 VN)", () => {
  it("orderValue divide por 100 solo en bonos", () => {
    expect(orderValue("AL30D", 1_000, 58.4, "buy").gross).toBeCloseTo(584);
    expect(orderValue("GGAL", 200, 4_820, "buy").gross).toBe(964_000);
  });
  it("valueHolding aplica la misma regla y calcula la ganancia", () => {
    const h = valueHolding({ symbol: "AL30D", name: "", assetClass: "Bono", tag: "", quantity: 2_500, avgPrice: 48.5, lastPrice: 58.4, dayChangePct: 0, currency: "USD" });
    expect(h.valuation).toBeCloseTo(1_460);
    expect(h.gain).toBeCloseTo(247.5);
  });
});

describe("chart-math y datos de demo", () => {
  it("toPoints mapea al viewBox con Y invertido", () => {
    const pts = toPoints([0, 10], 100, 50);
    expect(pts).toEqual([{ x: 0, y: 50 }, { x: 100, y: 0 }]);
  });
  it("movingAverage usa media parcial al inicio", () => {
    expect(movingAverage([2, 4, 6], 2)).toEqual([2, 3, 5]);
  });
  it("walk es determinística y termina en el valor pedido (evita errores de hidratación)", () => {
    const a = walk(7, 30, 100);
    expect(walk(7, 30, 100)).toEqual(a);
    expect(a.at(-1)).toBeCloseTo(100);
  });
});
