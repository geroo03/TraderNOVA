"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Sparkline } from "@/components/charts/LineChart";
import { Badge, StatusDot } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MsIcon } from "@/components/ui/MsIcon";
import { Panel, table } from "@/components/ui/Page";
import { Tabs } from "@/components/ui/Tabs";
import { Change } from "@/components/ui/Amount";
import { formatDecimal } from "@/lib/format";
import { instruments, intradaySeries, type Board } from "@/lib/market-data";

const PAGE_SIZE = 6;
const TERMS = ["CI", "24 HS", "48 HS"] as const;

function heatColor(pct: number): string {
  // Intensidad proporcional a la variación, con tope en ±4%.
  const a = Math.min(Math.abs(pct) / 4, 1) * 0.55 + 0.15;
  return pct >= 0 ? `rgb(78 222 163 / ${a})` : `rgb(255 84 81 / ${a})`;
}

export function MarketsView() {
  const [board, setBoard] = useState<Board>("Panel Líder");
  const [term, setTerm] = useState<(typeof TERMS)[number]>("24 HS");
  const [sector, setSector] = useState("Todos");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [watch, setWatch] = useState<string[]>(["GGAL", "YPFD", "BMA", "ALUA", "EDN"]);

  const boardItems = useMemo(() => instruments.filter((i) => i.board === board), [board]);
  const sectors = ["Todos", ...new Set(boardItems.map((i) => i.sector))];

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return boardItems
      .filter((i) => sector === "Todos" || i.sector === sector)
      .filter((i) => !q || i.symbol.toLowerCase().includes(q) || i.name.toLowerCase().includes(q));
  }, [boardItems, sector, query]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, pages - 1);
  const visible = rows.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const heat = instruments.filter((i) => i.board === "Panel Líder").sort((a, b) => b.volumeM - a.volumeM);

  function changeBoard(b: Board) {
    setBoard(b);
    setSector("Todos");
    setPage(0);
  }

  function toggleWatch(symbol: string) {
    setWatch((w) => (w.includes(symbol) ? w.filter((s) => s !== symbol) : [...w, symbol]));
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Tabs
            label="Mercado"
            value={board}
            onChange={changeBoard}
            items={[
              { id: "Panel Líder", label: "Acciones (Panel Líder)", count: instruments.filter((i) => i.board === "Panel Líder").length },
              { id: "CEDEAR", label: "CEDEARs", count: instruments.filter((i) => i.board === "CEDEAR").length },
              { id: "Bono", label: "Bonos y Renta Fija", count: instruments.filter((i) => i.board === "Bono").length },
            ]}
          />
          <Tabs size="sm" label="Plazo" value={term} onChange={setTerm} items={TERMS.map((t) => ({ id: t, label: t }))} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex min-w-56 flex-1 items-center gap-2 rounded-lg bg-surface px-3 py-2">
            <MsIcon name="search" size={16} className="text-fg-subtle" />
            <span className="sr-only">Buscar</span>
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
              }}
              placeholder="Buscar por símbolo o empresa (ej. GGAL, Pampa)…"
              className="w-full bg-transparent text-xs outline-none"
            />
          </label>
          <div className="flex flex-wrap gap-1" role="group" aria-label="Sector">
            {sectors.map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={sector === s}
                onClick={() => {
                  setSector(s);
                  setPage(0);
                }}
                className={`text-label rounded-md px-2 py-1 ${sector === s ? "bg-primary text-on-primary" : "bg-surface-high text-fg-muted"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <Panel title={`Panel ${board === "Bono" ? "de Bonos" : board === "CEDEAR" ? "CEDEARs" : "Líder BYMA"}`} actions={<Badge>{rows.length} activos</Badge>}>
          <div className={table.wrap}>
            <table className={`${table.table} min-w-[680px]`}>
              <thead>
                <tr>
                  <th className={table.th}>
                    <span className="sr-only">Favorito</span>
                  </th>
                  <th className={table.th}>Símbolo</th>
                  <th className={table.th}>Empresa / Emisor</th>
                  <th className={`${table.th} text-right`}>Último</th>
                  <th className={`${table.th} text-right`}>Var %</th>
                  <th className={`${table.th} text-right`}>Volumen</th>
                  <th className={table.th}>Tendencia</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((i) => (
                  <tr key={i.symbol} className={table.row}>
                    <td className={table.td}>
                      <button
                        type="button"
                        aria-pressed={watch.includes(i.symbol)}
                        aria-label={`Watchlist ${i.symbol}`}
                        onClick={() => toggleWatch(i.symbol)}
                        className={watch.includes(i.symbol) ? "text-[#f5b942]" : "text-fg-subtle"}
                      >
                        <MsIcon name={watch.includes(i.symbol) ? "star-fill" : "star"} size={16} />
                      </button>
                    </td>
                    <td className={table.td}>
                      <Link href={`/terminal/${i.symbol}`} className="flex items-center gap-1.5 font-mono text-sm font-semibold hover:text-primary">
                        {i.symbol}
                        <Badge className="py-0">{i.board === "Panel Líder" ? "LÍDER" : i.ratio ?? "USD"}</Badge>
                      </Link>
                    </td>
                    <td className={`${table.td} text-fg-subtle`}>{i.name}</td>
                    <td className={`${table.td} text-right font-mono font-semibold`}>
                      {i.currency === "USD" ? "U$S " : "$"}
                      {formatDecimal(i.price)}
                    </td>
                    <td className={`${table.td} text-right font-mono`}>
                      <Change value={i.changePct} />
                    </td>
                    <td className={`${table.td} text-right font-mono text-fg-subtle`}>${formatDecimal(i.volumeM)}M</td>
                    <td className={table.td}>
                      <Sparkline
                        values={intradaySeries(i.symbol, i.price, 24)}
                        color={i.changePct >= 0 ? "var(--color-positive)" : "var(--color-alert)"}
                        className="h-6 w-20"
                        label={`Tendencia ${i.symbol}`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between pt-3 text-xs text-fg-subtle">
            <span>
              Mostrando {visible.length ? safePage * PAGE_SIZE + 1 : 0} a {safePage * PAGE_SIZE + visible.length} de {rows.length} · plazo {term}
            </span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>
                Anterior
              </Button>
              <span className="font-mono">
                {safePage + 1} / {pages}
              </span>
              <Button size="sm" variant="secondary" disabled={safePage >= pages - 1} onClick={() => setPage(safePage + 1)}>
                Siguiente
              </Button>
            </div>
          </div>
        </Panel>
      </div>

      <div className="flex flex-col gap-4">
        <Panel title={<><MsIcon name="star-fill" size={16} className="text-[#f5b942]" /> Mi Watchlist</>} actions={<Badge>{watch.length} activos</Badge>}>
          <ul className="flex flex-col gap-1.5">
            {watch.map((s) => {
              const i = instruments.find((x) => x.symbol === s);
              if (!i) return null;
              return (
                <li key={s}>
                  <Link href={`/terminal/${s}`} className="flex items-center justify-between rounded-lg bg-surface-high px-3 py-2 hover:bg-surface-higher">
                    <span>
                      <span className="font-mono text-sm font-semibold">{s}</span>
                      <span className="block text-[11px] text-fg-subtle">{i.name}</span>
                    </span>
                    <span className="text-right font-mono text-xs">
                      <span className="block font-semibold">${formatDecimal(i.price)}</span>
                      <Change value={i.changePct} />
                    </span>
                  </Link>
                </li>
              );
            })}
            {watch.length === 0 && <li className="text-xs text-fg-subtle">Tocá la estrella de un activo para seguirlo.</li>}
          </ul>
        </Panel>

        <Panel title={<><MsIcon name="grid_view" size={16} className="text-primary" /> Heatmap S&amp;P Merval</>} subtitle="Tamaño por volumen · color por variación">
          <div className="grid grid-cols-4 gap-1">
            {heat.map((i, idx) => (
              <Link
                key={i.symbol}
                href={`/terminal/${i.symbol}`}
                className={`flex flex-col justify-between rounded p-2 font-mono text-[11px] font-semibold text-fg hover:ring-1 hover:ring-fg/40 ${
                  idx === 0 ? "col-span-2 row-span-2 min-h-24 text-sm" : idx < 3 ? "col-span-2 min-h-12" : "min-h-12"
                }`}
                style={{ background: heatColor(i.changePct) }}
              >
                <span>{i.symbol}</span>
                <span>{i.changePct > 0 ? "+" : ""}{formatDecimal(i.changePct)}%</span>
              </Link>
            ))}
          </div>
        </Panel>

        <Panel title={<><MsIcon name="currency_exchange" size={16} className="text-positive" /> Arbitraje MEP automático</>}>
          <p className="text-xs text-fg-muted">
            Comprá AL30 en pesos y vendé AL30D en dólares en un solo paso. Brecha MEP/CCL hoy: <span className="font-mono text-positive">2,2%</span>.
          </p>
          <div className="flex items-center gap-2 pt-2">
            <StatusDot />
            <span className="text-label text-fg-subtle">Disponible en horario de rueda</span>
          </div>
        </Panel>
      </div>
    </div>
  );
}
