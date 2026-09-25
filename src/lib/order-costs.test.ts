import { describe, expect, it } from "vitest";
import { maxAffordable, orderCosts } from "./order-costs";

describe("orderCosts", () => {
  it("reproduce el desglose del Figma (500 GGAL a $4.850)", () => {
    const c = orderCosts(500, 4_850, "buy");
    expect(c.gross).toBe(2_425_000);
    expect(c.commission).toBe(3_637.5);
    expect(c.marketRights).toBe(1_940);
    expect(c.vat).toBe(1_171.28);
    expect(c.total).toBe(2_431_748.78);
  });

  it("en la venta descuenta los aranceles del bruto", () => {
    const c = orderCosts(500, 4_850, "sell");
    expect(c.total).toBe(2_425_000 - 3_637.5 - 1_940 - 1_171.28);
  });

  it("devuelve todo en cero ante cantidades o precios inválidos", () => {
    for (const [q, p] of [[0, 100], [10, 0], [-1, 100], [Number.NaN, 100]]) {
      expect(orderCosts(q, p, "buy").total).toBe(0);
    }
  });
});

describe("maxAffordable", () => {
  it("no permite superar el disponible una vez sumados los aranceles", () => {
    const qty = maxAffordable(3_820_400, 4_850);
    expect(orderCosts(qty, 4_850, "buy").total).toBeLessThanOrEqual(3_820_400);
    expect(orderCosts(qty + 1, 4_850, "buy").total).toBeGreaterThan(3_820_400);
  });

  it("es cero sin saldo o sin precio", () => {
    expect(maxAffordable(0, 100)).toBe(0);
    expect(maxAffordable(1_000, 0)).toBe(0);
  });
});
