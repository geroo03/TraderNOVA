import { seeded } from "./random";

export interface JournalTrade {
  symbol: string;
  direction: "LONG" | "SHORT";
  setup: string;
  entry: number;
  exit: number;
  pnl: number;
}

export interface JournalDay {
  /** Día del mes (1..28). */
  day: number;
  weekday: number; // 0 = lunes
  pnl: number;
  trades: JournalTrade[];
  volumeM: number;
  tags: string[];
}

const SETUPS = ["Breakout", "Pullback EMA20", "Soporte", "Gap fill", "Reversión"];
const SYMBOLS = ["GGAL", "YPFD", "AAPL", "MELI", "PAMP", "AL30D", "BMA"];
const TAGS = ["#Disciplina", "#Paciencia", "#SetupCalidad", "#Sobreoperé", "#RespetéStop"];

/** Febrero 2025: el 1 cae sábado. Semana arranca lunes. */
export const MONTH = { label: "Febrero 2025", days: 28, firstWeekday: 5 } as const;

const fixed18: JournalTrade[] = [
  { symbol: "GGAL", direction: "LONG", setup: "Breakout", entry: 4_620, exit: 4_850, pnl: 315_400 },
  { symbol: "YPFD", direction: "LONG", setup: "Soporte", entry: 27_600, exit: 28_450, pnl: 192_000 },
  { symbol: "AAPL", direction: "LONG", setup: "Pullback EMA20", entry: 18_050, exit: 18_350, pnl: 42_750 },
  { symbol: "AL30D", direction: "SHORT", setup: "Reversión", entry: 58.1, exit: 58.4, pnl: -68_000 },
];

function buildDay(day: number): JournalDay | null {
  const weekday = (MONTH.firstWeekday + day - 1) % 7;
  if (weekday >= 5) return null; // fin de semana: sin rueda
  if (day === 17) return { day, weekday, pnl: 0, trades: [], volumeM: 0, tags: ["Feriado"] }; // Carnaval (17 feb 2025)
  if (day === 18) return { day, weekday, pnl: fixed18.reduce((a, t) => a + t.pnl, 0), trades: fixed18, volumeM: 12.4, tags: ["#Disciplina", "#SetupCalidad"] };
  if (day > 25) return null; // ruedas futuras del mes demo

  const rnd = seeded(day * 97);
  const n = 1 + Math.floor(rnd() * 5);
  const trades: JournalTrade[] = Array.from({ length: n }, () => {
    const win = rnd() < 0.66;
    const symbol = SYMBOLS[Math.floor(rnd() * SYMBOLS.length)];
    const pnl = Math.round((win ? 40_000 + rnd() * 180_000 : -(20_000 + rnd() * 110_000)) / 50) * 50;
    const entry = 1_000 + Math.round(rnd() * 20_000);
    return { symbol, direction: rnd() < 0.8 ? "LONG" : "SHORT", setup: SETUPS[Math.floor(rnd() * SETUPS.length)], entry, exit: Math.round(entry * (1 + pnl / 4_000_000)), pnl };
  });
  return {
    day,
    weekday,
    pnl: trades.reduce((a, t) => a + t.pnl, 0),
    trades,
    volumeM: Math.round((2 + rnd() * 10) * 10) / 10,
    tags: [TAGS[Math.floor(rnd() * TAGS.length)]],
  };
}

export const journalDays: (JournalDay | null)[] = Array.from({ length: MONTH.days }, (_, i) => buildDay(i + 1));

export function monthStats() {
  const days = journalDays.filter((d): d is JournalDay => !!d && d.trades.length > 0);
  const trades = days.flatMap((d) => d.trades);
  const wins = trades.filter((t) => t.pnl > 0);
  const losses = trades.filter((t) => t.pnl < 0);
  const grossWin = wins.reduce((a, t) => a + t.pnl, 0);
  const grossLoss = -losses.reduce((a, t) => a + t.pnl, 0);
  const best = days.reduce((a, d) => (d.pnl > a.pnl ? d : a), days[0]);
  return {
    net: grossWin - grossLoss,
    winRate: trades.length ? (wins.length / trades.length) * 100 : 0,
    wins: wins.length,
    losses: losses.length,
    avgWin: wins.length ? grossWin / wins.length : 0,
    avgLoss: losses.length ? grossLoss / losses.length : 0,
    profitFactor: grossLoss ? grossWin / grossLoss : 0,
    best,
    volumeM: days.reduce((a, d) => a + d.volumeM, 0),
  };
}
