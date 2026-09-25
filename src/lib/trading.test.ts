import { describe, expect, it } from "vitest";
import { accountSnapshot, crosses, matchOrders, sellableQty, type AccountBase, type LiveOrder, type Movement } from "./trading";
import { orderValue } from "./orders";
import { REAL_BASE, SEED_MOVEMENTS, SEED_ORDERS } from "./store/demo-data";

const base: AccountBase = { ars: 1_000_000, usd: 1_000, positions: { GGAL: { qty: 100, avgPrice: 4_000 } } };
let n = 0;
const id = (p: string) => `${p}-${++n}`;
const order = (o: Partial<LiveOrder>): LiveOrder => ({
  id: id("T"),
  time: "10:00:00",
  symbol: "GGAL",
  side: "buy",
  type: "Límite",
  term: "24hs",
  quantity: 10,
  filled: 0,
  price: 5_000,
  status: "working",
  currency: "ARS",
  ...o,
});

describe("accountSnapshot", () => {
  it("la semilla respeta el disponible del Figma", () => {
    const s = accountSnapshot(REAL_BASE, SEED_ORDERS, SEED_MOVEMENTS);
    expect(s.availableArs).toBeCloseTo(3_820_400, 2);
    expect(s.positions.GGAL.qty).toBe(1_200);
    // 400 nominales de AL30D siguen comprometidos en la venta parcial.
    expect(sellableQty(s, "AL30D")).toBe(2_100);
  });

  it("una compra abierta reserva fondos y al ejecutarse debita y suma tenencia con PPC", () => {
    const cost = orderValue("GGAL", 10, 5_000, "buy").total;
    const open = accountSnapshot(base, [order({})]);
    expect(open.reservedArs).toBeCloseTo(cost);
    expect(open.ars).toBe(1_000_000);
    const done = accountSnapshot(base, [order({ status: "executed", filled: 10 })]);
    expect(done.ars).toBeCloseTo(1_000_000 - cost);
    expect(done.positions.GGAL).toEqual({ qty: 110, avgPrice: (100 * 4_000 + 10 * 5_000) / 110 });
  });

  it("los bonos se valúan cada 100 VN y liquidan en su moneda", () => {
    const s = accountSnapshot(base, [order({ symbol: "AL30D", price: 58, quantity: 1_000, filled: 1_000, status: "executed", currency: "USD" })]);
    expect(s.usd).toBeCloseTo(1_000 - orderValue("AL30D", 1_000, 58, "buy").total);
    expect(orderValue("AL30D", 1_000, 58, "buy").gross).toBe(580);
    expect(s.ars).toBe(1_000_000);
  });

  it("las ventas ejecutadas acreditan y liberan tenencia; las abiertas la comprometen", () => {
    const s = accountSnapshot(base, [order({ side: "sell", quantity: 40, filled: 40, status: "executed" }), order({ side: "sell", quantity: 30 })]);
    expect(s.positions.GGAL.qty).toBe(60);
    expect(sellableQty(s, "GGAL")).toBe(30);
    expect(s.ars).toBeCloseTo(1_000_000 + orderValue("GGAL", 40, 5_000, "sell").total);
  });

  it("los depósitos cuentan al acreditarse; los retiros, al pedirse; los históricos nunca", () => {
    const mov = (m: Partial<Movement>): Movement => ({ id: "m", date: "", kind: "deposit", title: "", reference: "", counterparty: "", amount: 100, currency: "ARS", status: "Acreditado", ...m });
    const s = accountSnapshot(base, [], [mov({}), mov({ status: "En proceso", amount: 999 }), mov({ amount: -50, kind: "withdrawal", status: "En proceso" }), mov({ historic: true, amount: 7 })]);
    expect(s.ars).toBe(1_000_050);
  });
});

describe("matchOrders", () => {
  it("límite: compra se ejecuta con precio ≤ límite, venta con ≥; stop al revés", () => {
    expect(crosses({ side: "buy", type: "Límite", price: 100 }, 99)).toBe(true);
    expect(crosses({ side: "buy", type: "Límite", price: 100 }, 101)).toBe(false);
    expect(crosses({ side: "sell", type: "Límite", price: 100 }, 101)).toBe(true);
    expect(crosses({ side: "buy", type: "Stop Límite", price: 100 }, 101)).toBe(true);
    expect(crosses({ side: "sell", type: "Stop Límite", price: 100 }, 99)).toBe(true);
  });

  it("sin cambios devuelve la misma referencia (no dispara escrituras)", () => {
    const list = [order({})];
    const r = matchOrders(list, { GGAL: 5_100 }, "t", id);
    expect(r.orders).toBe(list);
    expect(r.events).toHaveLength(0);
  });

  it("ejecuta la entrada, activa el bracket y luego dispara el stop con su resultado", () => {
    const entry = order({ bracket: { stop: 4_900, target: 5_200 } });
    const filled = matchOrders([entry], { GGAL: 4_990 }, "t", id);
    expect(filled.events[0].kind).toBe("fill");
    expect(filled.orders[0]).toMatchObject({ status: "executed", filled: 10, bracketState: "active" });

    const stopped = matchOrders(filled.orders, { GGAL: 4_880 }, "t", id);
    expect(stopped.events[0]).toMatchObject({ kind: "stop", price: 4_900, pnl: -1_000 });
    expect(stopped.orders[0]).toMatchObject({ side: "sell", type: "Stop loss", quantity: 10, status: "executed", parentId: entry.id });
    expect(stopped.orders[1].bracketState).toBe("stopped");

    // Ya resuelto: no vuelve a dispararse.
    expect(matchOrders(stopped.orders, { GGAL: 4_000 }, "t", id).events).toHaveLength(0);
  });

  it("dispara el take profit y la salida hereda el modo simulación", () => {
    const entry = order({ status: "executed", filled: 10, bracket: { stop: 4_900, target: 5_200 }, bracketState: "active", simulated: true });
    const r = matchOrders([entry], { GGAL: 5_250 }, "t", id);
    expect(r.events[0]).toMatchObject({ kind: "target", pnl: 2_000 });
    expect(r.orders[0].simulated).toBe(true);
    expect(r.orders[0].id.startsWith("SIM")).toBe(true);
  });
});
