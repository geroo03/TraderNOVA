/**
 * Tiempo de las velas sintéticas. La última vela es "ahora" en una rueda de referencia
 * (martes 18/02/2025 15:45, la fecha de los datos del Figma) y las anteriores retroceden
 * respetando la rueda de 11 a 17 hs y los fines de semana. Es determinístico: igual en servidor y cliente.
 */
export const FRAMES = ["1m", "5m", "15m", "1H", "1D", "1S"] as const;
export type Frame = (typeof FRAMES)[number];

const STEP_MIN: Partial<Record<Frame, number>> = { "1m": 1, "5m": 5, "15m": 15, "1H": 60 };
const SESSION_MIN = 6 * 60;
const LAST_MINUTE = 4 * 60 + 45; // 15:45 → minutos desde las 11:00
const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const REF = Date.UTC(2025, 1, 18);
const DAY = 86_400_000;

/** Volatilidad y deriva por vela según la temporalidad (más cortas, movimientos más chicos). */
export const FRAME_SHAPE: Record<Frame, { vol: number; drift: number }> = {
  "1m": { vol: 0.0012, drift: 0.00004 },
  "5m": { vol: 0.0025, drift: 0.0001 },
  "15m": { vol: 0.004, drift: 0.00018 },
  "1H": { vol: 0.008, drift: 0.0004 },
  "1D": { vol: 0.018, drift: 0.0012 },
  "1S": { vol: 0.04, drift: 0.004 },
};

export const isIntraday = (f: Frame) => STEP_MIN[f] !== undefined;
export const candlesPerSession = (f: Frame) => (isIntraday(f) ? SESSION_MIN / (STEP_MIN[f] as number) : 1);

/** Retrocede `n` días hábiles (lunes a viernes) desde la fecha de referencia. */
function tradingDaysBack(n: number): Date {
  let d = REF;
  let left = n;
  while (left > 0) {
    d -= DAY;
    const wd = new Date(d).getUTCDay();
    if (wd !== 0 && wd !== 6) left--;
  }
  return new Date(d);
}

export interface CandleTime {
  /** Días hábiles hacia atrás desde la rueda de referencia. */
  dayBack: number;
  /** Minutos desde la apertura (11:00); 0 en temporalidades diarias o mayores. */
  minute: number;
}

/** Momento de la vela `i` de una serie de `n` velas. */
export function candleTime(frame: Frame, i: number, n: number): CandleTime {
  const back = n - 1 - i;
  const step = STEP_MIN[frame];
  if (step === undefined) return { dayBack: frame === "1S" ? back * 5 : back, minute: 0 };
  const lastPos = Math.floor(LAST_MINUTE / step);
  const perSession = SESSION_MIN / step;
  const t = lastPos - back;
  const dayOffset = Math.floor(t / perSession);
  return { dayBack: dayOffset === 0 ? 0 : -dayOffset, minute: (t - dayOffset * perSession) * step };
}

/** ¿La vela `i` abre una rueda? (para reiniciar el VWAP). */
export function opensSession(frame: Frame, i: number, n: number): boolean {
  if (!isIntraday(frame)) return true;
  return candleTime(frame, i, n).minute === 0;
}

const pad = (v: number) => String(v).padStart(2, "0");

export function formatDay(dayBack: number): string {
  const d = tradingDaysBack(dayBack);
  return `${pad(d.getUTCDate())} ${MONTHS[d.getUTCMonth()]}`;
}

/** Etiqueta corta para el eje de tiempo. */
export function timeLabel(frame: Frame, i: number, n: number): string {
  const t = candleTime(frame, i, n);
  if (!isIntraday(frame)) {
    const d = tradingDaysBack(t.dayBack);
    return frame === "1S" ? `${MONTHS[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}` : `${pad(d.getUTCDate())} ${MONTHS[d.getUTCMonth()]}`;
  }
  const hh = 11 + Math.floor(t.minute / 60);
  return t.minute === 0 ? formatDay(t.dayBack) : `${pad(hh)}:${pad(t.minute % 60)}`;
}

/** Etiqueta completa para la cruz de mira. */
export function fullTimeLabel(frame: Frame, i: number, n: number): string {
  const t = candleTime(frame, i, n);
  if (!isIntraday(frame)) return formatDay(t.dayBack) + (frame === "1S" ? " (semana)" : "");
  return `${formatDay(t.dayBack)} ${pad(11 + Math.floor(t.minute / 60))}:${pad(t.minute % 60)}`;
}
