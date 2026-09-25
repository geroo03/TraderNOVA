import { describe, expect, it } from "vitest";
import { performanceSeries, returnPct, seriesStats, RANGES } from "./performance";

describe("performance", () => {
  it("todas las series terminan en el patrimonio de referencia y son determinísticas", () => {
    for (const r of RANGES) {
      const s = performanceSeries(r, 1_000_000);
      expect(s.portfolio.at(-1)).toBeCloseTo(1_000_000);
      expect(s.merval[0]).toBeCloseTo(s.portfolio[0]);
      expect(s.mep[0]).toBeCloseTo(s.portfolio[0]);
      // Los benchmarks terminan por debajo de la cartera (rinden una fracción de su crecimiento).
      const growth = returnPct(s.portfolio);
      expect(returnPct(s.merval)).toBeLessThan(growth);
      expect(returnPct(s.mep)).toBeLessThan(returnPct(s.merval));
      expect(performanceSeries(r, 1_000_000)).toEqual(s);
    }
  });

  it("calcula máximo, drawdown y rendimiento", () => {
    const st = seriesStats([100, 120, 90, 110], "1A");
    expect(st.max).toBe(120);
    expect(st.maxIndex).toBe(1);
    expect(st.drawdownPct).toBeCloseTo(-25);
    expect(st.annualizedPct).toBeCloseTo(10);
    expect(returnPct([100, 120, 90, 110])).toBeCloseTo(10);
    expect(returnPct([100, 120, 90, 110], 1)).toBeCloseTo(20);
  });

  it("no anualiza rangos menores a un mes", () => {
    const st = seriesStats([100, 101, 102], "1D");
    expect(st.sharpe).toBeNull();
    expect(st.annualizedPct).toBeNull();
  });
});

describe("calibración", () => {
  it("cada rango da valores creíbles (evita Sharpe o rendimientos absurdos)", () => {
    for (const r of RANGES) {
      const st = seriesStats(performanceSeries(r, 30_000_000).portfolio, r);
      if (st.sharpe !== null) {
        expect(st.sharpe).toBeGreaterThan(0.8);
        expect(st.sharpe).toBeLessThan(3);
      }
      if (st.annualizedPct !== null) {
        expect(st.annualizedPct).toBeGreaterThan(15);
        expect(st.annualizedPct).toBeLessThan(70);
      }
      expect(st.drawdownPct).toBeGreaterThan(-30);
    }
  });
});
