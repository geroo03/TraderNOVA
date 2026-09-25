/**
 * Horario de rueda de BYMA: lunes a viernes hábiles de 11:00 a 17:00, hora de Argentina.
 * Argentina usa UTC−3 todo el año (sin horario de verano), así que alcanza con un corrimiento fijo.
 * Los feriados salen de `holidays.ts`.
 */
import { HOLIDAYS } from "./holidays";

const ART_OFFSET_MS = -3 * 60 * 60 * 1000;
export const OPEN_MINUTE = 11 * 60;
export const CLOSE_MINUTE = 17 * 60;
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

/** Fecha/hora "de pared" en Argentina, usando los getters UTC sobre un Date corrido. */
function art(ms: number) {
  const d = new Date(ms + ART_OFFSET_MS);
  return {
    weekday: d.getUTCDay(),
    minute: d.getUTCHours() * 60 + d.getUTCMinutes(),
    midnight: ms - ((((ms + ART_OFFSET_MS) % DAY_MS) + DAY_MS) % DAY_MS),
    dateKey: d.toISOString().slice(0, 10),
  };
}

/** Nombre del feriado de la fecha (hora argentina), si lo hay. */
export function holidayAt(ms: number): string | undefined {
  return HOLIDAYS[art(ms).dateKey];
}

const isTradingDay = (ms: number) => {
  const { weekday, dateKey } = art(ms);
  return weekday >= 1 && weekday <= 5 && !HOLIDAYS[dateKey];
};

export interface Session {
  open: boolean;
  /** Timestamp del próximo cierre (si está abierta) o de la próxima apertura (si está cerrada). */
  nextChange: number;
  /** Feriado del día, si la rueda está cerrada por eso. */
  holiday?: string;
}

export function sessionAt(ms: number): Session {
  const { minute, midnight } = art(ms);
  if (isTradingDay(ms) && minute >= OPEN_MINUTE && minute < CLOSE_MINUTE) {
    return { open: true, nextChange: midnight + CLOSE_MINUTE * 60_000 };
  }
  const holiday = holidayAt(ms);
  return { open: false, nextChange: nextOpen(ms), ...(holiday ? { holiday } : {}) };
}

/** Próxima apertura estrictamente posterior a `ms` (saltea fines de semana y feriados). */
export function nextOpen(ms: number): number {
  const { minute, midnight } = art(ms);
  // Un fin de semana largo con feriados no supera las dos semanas.
  for (let i = 0; i < 15; i++) {
    const day = midnight + i * DAY_MS;
    if (isTradingDay(day + DAY_MS / 2) && (i > 0 || minute < OPEN_MINUTE)) return day + OPEN_MINUTE * 60_000;
  }
  return midnight + 15 * DAY_MS + OPEN_MINUTE * 60_000;
}

/**
 * Hasta cuándo vale una orden del día cargada en `ms`: el cierre de la rueda en curso o,
 * si el mercado está cerrado, el cierre de la próxima rueda.
 */
export function orderValidUntil(ms: number): number {
  const s = sessionAt(ms);
  if (s.open) return s.nextChange;
  return s.nextChange + (CLOSE_MINUTE - OPEN_MINUTE) * 60_000;
}

/** "hoy 17:00", "mañana 11:00", "el lunes 11:00". */
export function describeTime(target: number, now: number): string {
  const a = art(target);
  const days = Math.round((a.midnight - art(now).midnight) / DAY_MS);
  const hh = `${String(Math.floor(a.minute / 60)).padStart(2, "0")}:${String(a.minute % 60).padStart(2, "0")}`;
  const when = days === 0 ? "hoy" : days === 1 ? "mañana" : `el ${WEEKDAYS[a.weekday]}`;
  return `${when} ${hh}`;
}
