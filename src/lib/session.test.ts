import { describe, expect, it } from "vitest";
import { describeTime, holidayAt, nextOpen, orderValidUntil, sessionAt } from "./session";

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

describe("feriados", () => {
  it("no hay rueda en feriados nacionales y se informa el motivo", () => {
    const s = sessionAt(at("2026-10-12T12:00"));
    expect(s.open).toBe(false);
    expect(s.holiday).toBe("Día de la Diversidad Cultural");
    expect(holidayAt(at("2026-10-13T12:00"))).toBeUndefined();
  });

  it("la próxima apertura saltea fines de semana largos", () => {
    // Viernes 9/10 a la noche → sábado, domingo y feriado del lunes 12 → martes 13.
    expect(nextOpen(at("2026-10-09T18:00"))).toBe(at("2026-10-13T11:00"));
    // Semana Santa 2026: jueves 2 y viernes 3 de abril sin rueda → lunes 6.
    expect(nextOpen(at("2026-04-01T18:00"))).toBe(at("2026-04-06T11:00"));
  });

  it("los trasladables caen en el lunes que corresponde", () => {
    expect(holidayAt(at("2026-11-23T12:00"))).toBe("Día de la Soberanía Nacional"); // 20/11 viernes → lunes 23
    expect(holidayAt(at("2026-11-20T12:00"))).toBeUndefined();
    expect(sessionAt(at("2026-11-20T12:00")).open).toBe(true);
  });

  it("una orden cargada la víspera de un feriado vence al cierre de la rueda siguiente", () => {
    expect(orderValidUntil(at("2026-10-09T20:00"))).toBe(at("2026-10-13T17:00"));
  });
});
