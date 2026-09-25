"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { LineChart } from "@/components/charts/LineChart";
import { OrderBook } from "@/components/trading/OrderBook";
import { Badge, StatusDot } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { MsIcon } from "@/components/ui/MsIcon";
import { Panel, Stat, table } from "@/components/ui/Page";
import { Tabs } from "@/components/ui/Tabs";
import { Change } from "@/components/ui/Amount";
import { formatDecimal, formatPercent } from "@/lib/format";
import { instruments, intradaySeries, marketIndices, type Board, type Instrument } from "@/lib/market-data";

type Filter = "fav" | Board;

function price(i: Instrument, v = i.price) {
  return `${i.currency === "USD" ? "U$S " : "$"}${formatDecimal(v)}`;
}

export function QuotesView() {
  const [filter, setFilter] = useState<Filter>("Panel Líder");
  const [query, setQuery] = useState("");
  const [favs, setFavs] = useState<Set<string>>(() => new Set(["GGAL", "YPFD", "AAPL", "MELI"]));
  const [selected, setSelected] = useState("GGAL");
  const [range, setRange] = useState<"1D" | "5D" | "1M" | "1A">("1D");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return instruments
      .filter((i) => (filter === "fav" ? favs.has(i.symbol) : i.board === filter))
      .filter((i) => !q || i.symbol.toLowerCase().includes(q) || i.name.toLowerCase().includes(q));
  }, [filter, query, favs]);

  const sel = instruments.find((i) => i.symbol === selected) ?? instruments[0];
  const series = useMemo(() => intradaySeries(`${sel.symbol}-${range}`, sel.price, range === "1D" ? 40 : 60), [sel, range]);

  function toggleFav(symbol: string) {
    setFavs((prev) => {
      const next = new Set(prev);
      if (next.has(symbol)) next.delete(symbol);
      else next.add(symbol);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="positive" className="uppercase">
          <StatusDot /> Mercado abierto BYMA
        </Badge>
        <span className="text-label text-fg-subtle">Rueda normal 11:00 a 17:00 hs · Liquidación CI / 24hs · Últ. sincro 14:32:08</span>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {marketIndices.map((m) => (
          <Stat
            key={m.label}
            label={m.label}
            value={"unit" in m ? `${formatDecimal(m.value).replace(/,00$/, "")} ${m.unit}` : formatDecimal(m.value)}
            hint={<Change value={m.changePct} className="font-mono" />}
          />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Panel
          title="Cotizaciones en tiempo real"
          subtitle="Tocá una fila para ver el detalle. La estrella agrega a favoritos."
          className="min-w-0"
          actions={
            <label className="flex items-center gap-2 rounded-lg bg-surface-high px-3 py-1.5">
              <MsIcon name="search" size={16} className="text-fg-subtle" />
              <span className="sr-only">Filtrar especie</span>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filtrar especie…" className="w-36 bg-transparent text-xs outline-none" />
            </label>
          }
        >
          <div className="flex flex-col gap-3">
            <Tabs
              label="Panel"
              value={filter}
              onChange={setFilter}
              items={[
                { id: "fav", label: "★ Favoritos", count: favs.size },
                { id: "Panel Líder", label: "Panel Líder" },
                { id: "CEDEAR", label: "CEDEARs" },
                { id: "Bono", label: "Bonos" },
              ]}
            />
            <div className={table.wrap}>
              <table className={`${table.table} min-w-[640px]`}>
                <thead>
                  <tr>
                    <th className={table.th}>Especie</th>
                    <th className={table.th}>Sector</th>
                    <th className={`${table.th} text-right`}>Último</th>
                    <th className={`${table.th} text-right`}>Var %</th>
                    <th className={`${table.th} text-right`}>Volumen</th>
                    <th className={table.th}>
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((i) => (
                    <tr
                      key={i.symbol}
                      onClick={() => setSelected(i.symbol)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelected(i.symbol);
                        }
                      }}
                      tabIndex={0}
                      aria-selected={selected === i.symbol}
                      className={`${table.row} cursor-pointer ${selected === i.symbol ? "bg-primary-strong/10" : ""}`}
                    >
                      <td className={table.td}>
                        <span className="flex items-center gap-2">
                          <button
                            type="button"
                            aria-label={favs.has(i.symbol) ? `Quitar ${i.symbol} de favoritos` : `Agregar ${i.symbol} a favoritos`}
                            aria-pressed={favs.has(i.symbol)}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFav(i.symbol);
                            }}
                            className={favs.has(i.symbol) ? "text-[#f5b942]" : "text-fg-subtle hover:text-fg"}
                          >
                            <MsIcon name={favs.has(i.symbol) ? "star-fill" : "star"} size={16} />
                          </button>
                          <span>
                            <span className="flex items-center gap-1.5 font-mono text-sm font-semibold">
                              {i.symbol}
                              {i.ratio && <Badge className="py-0">{i.ratio}</Badge>}
                            </span>
                            <span className="text-[11px] text-fg-subtle">{i.name}</span>
                          </span>
                        </span>
                      </td>
                      <td className={`${table.td} text-fg-subtle`}>{i.sector}</td>
                      <td className={`${table.td} text-right font-mono font-semibold`}>{price(i)}</td>
                      <td className={`${table.td} text-right font-mono`}>
                        <Change value={i.changePct} />
                      </td>
                      <td className={`${table.td} text-right font-mono text-fg-subtle`}>${formatDecimal(i.volumeM)}M</td>
                      <td className={`${table.td} text-right`}>
                        <Link
                          href={`/operar?especie=${i.symbol}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-label rounded bg-positive/15 px-2 py-1 text-positive hover:bg-positive/25"
                        >
                          OPERAR
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-xs text-fg-subtle">
                        No hay especies que coincidan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Panel>

        <Panel
          title={
            <span className="flex flex-col">
              <span className="font-mono text-lg">{sel.symbol}</span>
              <span className="text-xs font-normal text-fg-subtle">{sel.name}</span>
            </span>
          }
          actions={
            <Link href={`/terminal/${sel.symbol}`} aria-label="Abrir en terminal" className="text-fg-subtle hover:text-fg">
              <MsIcon name="open_in_new" size={18} />
            </Link>
          }
        >
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-label uppercase text-fg-subtle">Último precio</p>
              <p className="flex items-baseline gap-2">
                <span className="font-mono text-3xl font-bold">{price(sel)}</span>
                <span className={`font-mono text-sm font-semibold ${sel.changePct >= 0 ? "text-positive" : "text-negative"}`}>{formatPercent(sel.changePct)}</span>
              </p>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-label uppercase text-fg-subtle">Gráfico</span>
              <Tabs size="sm" label="Rango" value={range} onChange={setRange} items={(["1D", "5D", "1M", "1A"] as const).map((r) => ({ id: r, label: r }))} />
            </div>
            <div className="h-36 rounded-lg bg-surface-lowest p-2">
              <LineChart
                series={[{ values: series, color: sel.changePct >= 0 ? "var(--color-positive)" : "var(--color-alert)", area: true }]}
                gridLines={3}
                endDot
                label={`Evolución de ${sel.symbol}`}
              />
            </div>
            <div>
              <p className="text-label pb-1 uppercase text-fg-subtle">Libro de órdenes (5 puntas)</p>
              <OrderBook symbol={sel.symbol} price={sel.price} compact />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <ButtonLink href={`/operar?especie=${sel.symbol}`} variant="buy" icon="add_circle">
                Comprar {sel.symbol}
              </ButtonLink>
              <ButtonLink href={`/operar?especie=${sel.symbol}&lado=venta`} variant="sell" icon="do_not_disturb_on">
                Vender {sel.symbol}
              </ButtonLink>
            </div>
          </div>
        </Panel>
      </div>
      <p className="text-label text-fg-subtle">Prototipo · datos de ejemplo. Las cotizaciones no se actualizan en tiempo real.</p>
    </div>
  );
}
