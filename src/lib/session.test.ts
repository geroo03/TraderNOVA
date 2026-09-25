import { describe, expect, it } from "vitest";
import { describeTime, nextOpen, orderValidUntil, sessionAt } from "./session";

// Horas de Argentina expresadas con su offset: 2026-09-25 es viernes.
const at = (iso: string) => new Date(`${iso}-03:00`).getTime();

describe("horario de rueda BYMA", () => {
  it("abre de lunes a viernes de 11 a 17 hs (hora argentina)", () => {
    expect(sessionAt(at("2026-09-25T10:59")).open).toBe(false);
    expect(sessionAt(at("2026-09-25T11:00")).open).toBe(true);
    expect(sessionAt(at("2026-09-25T16:59")).open).toBe(true);
    expect(sessionAt(at("2026-09-25T17:00")).open).toBe(false);
    expect(sessionAt(at("2026-09-26T12:00")).open).toBe(false); // sábado
  });

  it("informa el próximo cierre o la próxima apertura", () => {
    expect(sessionAt(at("2026-09-25T14:00")).nextChange).toBe(at("2026-09-25T17:00"));
    expect(nextOpen(at("2026-09-24T09:00"))).toBe(at("2026-09-24T11:00"));
    expect(nextOpen(at("2026-09-24T18:00"))).toBe(at("2026-09-25T11:00"));
    // Viernes a la noche y sábado: abre el lunes.
    expect(nextOpen(at("2026-09-25T18:00"))).toBe(at("2026-09-28T11:00"));
    expect(nextOpen(at("2026-09-26T12:00"))).toBe(at("2026-09-28T11:00"));
  });

  it("una orden del día vence al cierre de su rueda; fuera de horario, al de la próxima", () => {
    expect(orderValidUntil(at("2026-09-25T12:30"))).toBe(at("2026-09-25T17:00"));
    expect(orderValidUntil(at("2026-09-25T20:00"))).toBe(at("2026-09-28T17:00"));
  });

  it("describe los horarios en lenguaje natural", () => {
    const now = at("2026-09-25T20:00");
    expect(describeTime(at("2026-09-28T11:00"), now)).toBe("el lunes 11:00");
    expect(describeTime(at("2026-09-24T11:00") + 86_400_000 * 2, at("2026-09-25T09:00"))).toBe("mañana 11:00");
    expect(describeTime(at("2026-09-25T17:00"), at("2026-09-25T12:00"))).toBe("hoy 17:00");
  });
});
