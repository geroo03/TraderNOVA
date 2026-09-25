"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MsIcon } from "@/components/ui/MsIcon";
import { Panel, Stat } from "@/components/ui/Page";
import { formatDecimal, formatInteger } from "@/lib/format";
import { journalDays, MONTH, monthStats, type JournalDay } from "@/lib/journal";
import { useLocalStore } from "@/lib/store/local-store";
import { KEYS } from "@/lib/store/demo-data";
import { useToast } from "@/components/ui/Toast";
import { downloadFile, toCsv } from "@/lib/download";

const SEED_NOTES: Record<number, string> = {
  18: "Hoy respeté el plan a rajatabla. Esperé la confirmación de volumen en la primera media hora antes de entrar en GGAL.",
};

const WEEKDAYS = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];
const signed = (v: number) => `${v >= 0 ? "+" : "-"}$${formatInteger(Math.abs(v))}`;

function dayClass(d: JournalDay | null, selected: boolean) {
  const base = "flex min-h-20 flex-col justify-between rounded-lg p-1.5 text-left transition";
  if (!d || d.trades.length === 0) return `${base} bg-surface-lowest/60 text-fg-subtle`;
  const tone = d.pnl >= 0 ? "bg-positive/10 hover:bg-positive/20" : "bg-alert/10 hover:bg-alert/20";
  return `${base} ${tone} ${selected ? "ring-2 ring-primary" : ""}`;
}

export function JournalView() {
  const stats = monthStats();
  const [selected, setSelected] = useState(18);
  const toast = useToast();
  const [notes, setNotes] = useLocalStore<Record<number, string>>(KEYS.journalNotes, SEED_NOTES);
  const [draft, setDraft] = useState<Record<number, string>>({});
  const [saved, setSaved] = useState(false);

  function exportMonth() {
    const rows = journalDays.flatMap((d) => (d ? d.trades.map((t) => [`${d.day}/02/2025`, t.symbol, t.direction, t.setup, t.entry, t.exit, t.pnl, notes[d.day] ?? ""]) : []));
    downloadFile("diario-trading-feb-2025.csv", toCsv(["fecha", "especie", "direccion", "setup", "entrada", "salida", "pnl", "nota"], rows));
  }
  const day = journalDays[selected - 1];
  const leading = Array.from({ length: MONTH.firstWeekday });
  const cells = [...leading.map(() => undefined), ...journalDays.map((d, i) => ({ d, n: i + 1 }))];
  const weeks: typeof cells[] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="P&L neto mensual" value={<span className={stats.net >= 0 ? "text-positive" : "text-negative"}>{signed(stats.net)}</span>} hint="Neto de comisiones" />
        <Stat label="Tasa de acierto" value={`${stats.winRate.toFixed(1).replace(".", ",")}%`} hint={`${stats.wins} ganadoras · ${stats.losses} perdedoras`} />
        <Stat label="Ganancia / pérdida prom." value={<span className="text-base">{signed(stats.avgWin)} / {signed(-stats.avgLoss)}</span>} hint="Expectativa matemática positiva" />
        <Stat label="Mejor rueda" value={<span className="text-positive">{signed(stats.best.pnl)}</span>} hint={`${stats.best.day} Feb · ${stats.best.trades.map((t) => t.symbol).slice(0, 2).join("/")}`} />
        <Stat label="Profit factor" value={formatDecimal(stats.profitFactor)} hint={`Vol. operado $${formatDecimal(stats.volumeM)}M ARS`} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Panel
          title={MONTH.label}
          subtitle="Tocá una rueda para ver el detalle"
          actions={
            <span className="flex flex-wrap items-center gap-3 text-[11px] text-fg-subtle">
              <Button size="sm" variant="secondary" icon="download" onClick={exportMonth}>
                Exportar mes
              </Button>
              <span className="flex items-center gap-1"><span className="size-2 rounded-sm bg-positive" /> Rueda verde</span>
              <span className="flex items-center gap-1"><span className="size-2 rounded-sm bg-alert" /> Rueda roja</span>
              <span className="flex items-center gap-1"><span className="size-2 rounded-sm bg-surface-higher" /> Sin operatoria</span>
            </span>
          }
          className="min-w-0"
        >
          <div className="overflow-x-auto">
            <div className="grid min-w-[640px] grid-cols-[repeat(7,minmax(0,1fr))_110px] gap-1">
              {WEEKDAYS.map((w) => (
                <div key={w} className="text-label py-1 text-center text-fg-subtle">{w}</div>
              ))}
              <div className="text-label py-1 text-center text-fg-subtle">SEMANA</div>
              {weeks.map((week, wi) => {
                const total = week.reduce((a, c) => a + (c?.d?.pnl ?? 0), 0);
                const padded = [...week, ...Array.from({ length: 7 - week.length }, () => undefined)];
                return [
                  ...padded.map((c, ci) =>
                    c ? (
                      <button
                        key={`${wi}-${ci}`}
                        type="button"
                        disabled={!c.d || c.d.trades.length === 0}
                        onClick={() => {
                          setSelected(c.n);
                          setSaved(false);
                        }}
                        aria-pressed={selected === c.n}
                        aria-label={`${c.n} de febrero${c.d ? `, resultado ${signed(c.d.pnl)}` : ", sin operatoria"}`}
                        className={dayClass(c.d, selected === c.n)}
                      >
                        <span className="font-mono text-xs font-semibold">{c.n}</span>
                        {c.d && c.d.trades.length > 0 ? (
                          <span>
                            <span className={`block font-mono text-[11px] font-semibold ${c.d.pnl >= 0 ? "text-positive" : "text-negative"}`}>{signed(c.d.pnl)}</span>
                            <span className="text-[10px] text-fg-subtle">{c.d.trades.length} trades</span>
                          </span>
                        ) : (
                          <span className="text-[10px]">{c.d?.tags[0] ?? ""}</span>
                        )}
                      </button>
                    ) : (
                      <div key={`${wi}-${ci}`} />
                    ),
                  ),
                  <div key={`w${wi}`} className="flex flex-col justify-center rounded-lg bg-surface-high p-1.5 text-center">
                    <span className="text-label text-fg-subtle">S{wi + 1}</span>
                    <span className={`font-mono text-[11px] font-semibold ${total >= 0 ? "text-positive" : "text-negative"}`}>{signed(total)}</span>
                  </div>,
                ];
              })}
            </div>
          </div>
        </Panel>

        {day && (
          <Card className="flex flex-col gap-4 p-4">
            <div>
              <p className="text-label uppercase text-fg-subtle">Rueda seleccionada · {day.trades.length} operaciones</p>
              <h2 className="text-xl font-bold">
                {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"][day.weekday]} {day.day} Feb 2025
              </h2>
              <p className={`font-mono text-lg font-semibold ${day.pnl >= 0 ? "text-positive" : "text-negative"}`}>{signed(day.pnl)} ARS</p>
            </div>
            <dl className="grid grid-cols-3 gap-2 text-center">
              {[
                ["Trades", String(day.trades.length)],
                ["Win rate", `${Math.round((day.trades.filter((t) => t.pnl > 0).length / Math.max(1, day.trades.length)) * 100)}%`],
                ["Volumen", `$${formatDecimal(day.volumeM)}M`],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg bg-surface-high p-2">
                  <dt className="text-label uppercase text-fg-subtle">{k}</dt>
                  <dd className="font-mono text-sm font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="rounded-lg bg-primary/10 p-3 text-xs text-fg-muted">
              <p className="flex items-center gap-1 pb-1 font-semibold text-primary">
                <MsIcon name="star_shine" size={14} /> Nova Insight · auditoría cuantitativa
              </p>
              {day.pnl >= 0
                ? "Excelente disciplina: tus ganadoras duraron más que tus perdedoras y cortaste pérdidas en el stop definido."
                : "Rueda negativa: 2 entradas fueron contra tendencia. Revisá esperar confirmación de volumen antes de operar reversiones."}
            </div>
            <div>
              <p className="text-label pb-1 uppercase text-fg-subtle">Operaciones cerradas</p>
              <ul className="flex flex-col gap-1">
                {day.trades.map((t, i) => (
                  <li key={i} className="flex items-center justify-between rounded-lg bg-surface-high px-2 py-1.5 text-xs">
                    <span className="flex items-center gap-2">
                      <span className="font-mono font-semibold">{t.symbol}</span>
                      <Badge tone={t.direction === "LONG" ? "positive" : "negative"} className="py-0">{t.direction}</Badge>
                      <span className="text-fg-subtle">{t.setup}</span>
                    </span>
                    <span className={`font-mono font-semibold ${t.pnl >= 0 ? "text-positive" : "text-negative"}`}>{signed(t.pnl)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="journal-note" className="text-label uppercase text-fg-subtle">
                Bitácora personal & reflexión
              </label>
              <textarea
                id="journal-note"
                rows={4}
                value={draft[day.day] ?? notes[day.day] ?? ""}
                onChange={(e) => {
                  setDraft((n) => ({ ...n, [day.day]: e.target.value }));
                  setSaved(false);
                }}
                placeholder="¿Qué salió bien? ¿Qué cambiarías?"
                className="rounded-lg bg-surface-high p-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
              <div className="flex flex-wrap gap-1">
                {day.tags.map((t) => (
                  <Badge key={t} tone="primary">{t}</Badge>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  icon="save"
                  disabled={draft[day.day] === undefined}
                  onClick={() => {
                    setNotes((n) => ({ ...n, [day.day]: draft[day.day] ?? n[day.day] ?? "" }));
                    setDraft((d) => {
                      const next = { ...d };
                      delete next[day.day];
                      return next;
                    });
                    setSaved(true);
                    toast({ title: "Bitácora guardada", text: `${day.day} de febrero` });
                  }}
                >
                  Guardar bitácora
                </Button>
                {saved && <span role="status" className="text-xs text-positive">Guardado en este navegador</span>}
                {draft[day.day] !== undefined && <span className="text-xs text-fg-subtle">Cambios sin guardar</span>}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
