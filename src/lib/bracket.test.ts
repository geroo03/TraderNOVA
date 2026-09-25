import { describe, expect, it } from "vitest";
import { bracketFromPct, bracketRisk, defaultBracket, priceDeviation, validateBracket } from "./bracket";

describe("bracket", () => {
  it("compra: stop abajo y target arriba", () => {
    expect(defaultBracket("buy", 1000)).toEqual({ stop: 980, target: 1040 });
  });
  it("venta: los lados se invierten", () => {
    expect(bracketFromPct("sell", 1000, 2, 4)).toEqual({ stop: 1020, target: 960 });
  });
  it("valida la coherencia con el lado", () => {
    expect(validateBracket("buy", 1000, { stop: 980, target: 1040 })).toBeNull();
    expect(validateBracket("buy", 1000, { stop: 1010, target: 1040 })).toMatch(/stop/);
    expect(validateBracket("buy", 1000, { stop: 980, target: 990 })).toMatch(/target/);
    expect(validateBracket("sell", 1000, { stop: 980, target: 960 })).toMatch(/stop/);
    expect(validateBracket("sell", 1000, { stop: NaN, target: 960 })).toMatch(/válidos/);
  });
  it("calcula riesgo y relación riesgo/beneficio", () => {
    expect(bracketRisk(10, 1000, { stop: 980, target: 1040 })).toEqual({ maxLoss: 200, maxGain: 400, ratio: 2 });
  });
  it("mide el desvío contra el precio de mercado", () => {
    expect(priceDeviation(1100, 1000)).toBeCloseTo(0.1);
    expect(priceDeviation(1000, 0)).toBe(0);
  });
});
