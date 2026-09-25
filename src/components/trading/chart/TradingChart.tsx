"use client";

import { useEffect, useEffectEvent, useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { MsIcon } from "@/components/ui/MsIcon";
import { Tabs } from "@/components/ui/Tabs";
import { usePopover } from "@/components/ui/usePopover";
import type { MsIconName } from "@/components/ui/ms-icon-names";
import { FRAMES, FRAME_SHAPE, fullTimeLabel, opensSession, timeLabel, type Frame } from "@/lib/chart-time";
import { downloadFile, stamp, toCsv } from "@/lib/download";
import { formatDecimal, formatInteger, formatPercent } from "@/lib/format";
import { bollinger, ema, heikinAshi, macd, niceTicks, rsi, sma, vwap, type Series } from "@/lib/indicators";
import { findInstrument, priceCandles, type Instrument } from "@/lib/market-data";
import { useLocalStore } from "@/lib/store/local-store";
import type { TicketLevels } from "../useTicketLevels";
import { CHART_TYPES, INDICATORS, useChartPrefs, type IndicatorId } from "./prefs";

/** Velas de historia por temporalidad: suficiente recorrido para zoom y desplazamiento. */
const HISTORY = 320;
const AXIS_W = 66;
const AXIS_H = 22;
const RSI_H = 86;
const MACD_H = 100;
/** Espacio vacío a la derecha de la última vela, como en las plataformas profesionales. */
const PAD_SLOTS = 5;
const MIN_COUNT = 15;
const DEFAULT_COUNT = 90;

const UP = "var(--color-positive)";
const DOWN = "var(--color-alert)";
const color = (id: IndicatorId) => INDICATORS.find((i) => i.id === id)?.color ?? "currentColor";

type DrawTool = "cursor" | "trend" | "hline" | "measure" | "text";
interface Pt {
  /** Índice de vela (puede ser fraccionario): los dibujos acompañan el zoom y el desplazamiento. */
  i: number;
  price: number;
}
type Drawing = { kind: "trend" | "measure"; a: Pt; b: Pt } | { kind: "hline"; price: number } | { kind: "text"; at: Pt; text: string };
const NO_DRAWINGS: Record<string, Drawing[]> = {};

const TOOLS: { id: DrawTool; icon: MsIconName; label: string }[] = [
  { id: "cursor", icon: "arrow_selector_tool", label: "Cursor (arrastrá para desplazar)" },
  { id: "trend", icon: "show_chart", label: "Línea de tendencia" },
  { id: "hline", icon: "horizontal_rule", label: "Línea horizontal" },
  { id: "measure", icon: "straighten", label: "Medir" },
  { id: "text", icon: "text_fields", label: "Texto" },
];

interface TradingChartProps {
  instrument: Instrument;
  /** Líneas de la boleta (entrada, stop, target) que se pueden arrastrar sobre el gráfico. */
  levels?: TicketLevels;
  onLevelsChange?: (levels: TicketLevels) => void;
  /** Alto del gráfico (clases de Tailwind), p. ej. "h-[460px]" o "h-full". */
  className?: string;
  onExpand?: () => void;
  expanded?: boolean;
}

/** Path de una serie con huecos (null) sobre los índices visibles. */
function seriesPath(from: number, to: number, get: (i: number) => number | null | undefined, x: (i: number) => number, y: (v: number) => number): string {
  let d = "";
  let pen = false;
  for (let i = from; i <= to; i++) {
    const v = get(i);
    if (v === null || v === undefined) {
      pen = false;
      continue;
    }
    d += `${pen ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)} `;
    pen = true;
  }
  return d;
}

const priceText = (p: number) => formatDecimal(p);

/**
 * Gráfico profesional de la boleta: velas/barras/línea/área/Heikin Ashi, escalas de precio y tiempo,
 * cruz de mira con OHLC, zoom (rueda, botones o teclado), desplazamiento (arrastrar), indicadores con
 * paneles propios (RSI, MACD), herramientas de dibujo y líneas de orden arrastrables.
 */
export function TradingChart({ instrument, levels, onLevelsChange, className = "h-[460px]", onExpand, expanded = false }: TradingChartProps) {
  const uid = useId().replace(/:/g, "");
  const [prefs, setPrefs] = useChartPrefs();
  const { frame, type, indicators: ind } = prefs;
  const symbol = instrument.symbol;
  const [tool, setTool] = useState<DrawTool>("cursor");
  const [pending, setPending] = useState<Pt | null>(null);
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
  const [allDrawings, setAllDrawings] = useLocalStore("chart-drawings-v2", NO_DRAWINGS);
  const drawKey = `${symbol}-${frame}`;
  const drawings = allDrawings[drawKey] ?? [];

  // ---------- Datos ----------
  const refPrice = findInstrument(symbol)?.price ?? instrument.price;
  const history = useMemo(() => {
    const s = FRAME_SHAPE[frame];
    return priceCandles(`${symbol}-${frame}-pro`, refPrice, HISTORY, s.vol, s.drift);
  }, [symbol, frame, refPrice]);
  // Solo la última vela sigue el precio en vivo; el resto de la historia queda fija.
  const raw = useMemo(() => {
    const last = history[history.length - 1];
    const live = instrument.price;
    return [...history.slice(0, -1), { ...last, close: live, high: Math.max(last.high, live), low: Math.min(last.low, live) }];
  }, [history, instrument.price]);
  const data = useMemo(() => (type === "heikin" ? heikinAshi(raw) : raw), [raw, type]);
  const n = data.length;
  const closes = useMemo(() => raw.map((c) => c.close), [raw]);
  const calc = useMemo(
    () => ({
      ema20: ema(closes, 20),
      ema50: ema(closes, 50),
      sma200: sma(closes, 200),
      bb: bollinger(closes, 20, 2),
      vwap: vwap(raw, (i) => opensSession(frame, i, raw.length)),
      rsi: rsi(closes, 14),
      macd: macd(closes),
    }),
    [closes, raw, frame],
  );

  // ---------- Vista (zoom y desplazamiento) ----------
  const viewKey = `${symbol}-${frame}`;
  const [view, setView] = useState({ key: viewKey, end: HISTORY - 1, count: DEFAULT_COUNT });
  if (view.key !== viewKey) setView({ key: viewKey, end: HISTORY - 1, count: DEFAULT_COUNT });

  // ---------- Geometría ----------
  const plotRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 420 });
  useEffect(() => {
    const el = plotRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: Math.max(240, Math.round(e.contentRect.width)), h: Math.max(200, Math.round(e.contentRect.height)) }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const panes = [ind.rsi && ("rsi" as const), ind.macd && ("macd" as const)].filter((p): p is "rsi" | "macd" => !!p);
  const paneH = { rsi: RSI_H, macd: MACD_H };
  const subTotal = panes.reduce((a, p) => a + paneH[p], 0);
  const plotW = size.w - AXIS_W;
  const mainH = Math.max(120, size.h - AXIS_H - subTotal);
  const slots = view.count + PAD_SLOTS;
  const slotW = plotW / slots;
  const first = view.end - view.count + 1;
  const xOf = (i: number) => (i - first + 0.5) * slotW;
  const iFrom = Math.max(0, Math.floor(first));
  const iTo = Math.min(n - 1, Math.ceil(view.end));

  const volOn = ind.volume;
  // Margen superior para la leyenda (símbolo, OHLC e indicadores) sin tapar las velas.
  const priceTop = 46;
  const priceBottom = mainH * (volOn ? 0.8 : 0.95);
  const { lo, hi } = useMemo(() => {
    let l = Infinity;
    let h = -Infinity;
    for (let i = iFrom; i <= iTo; i++) {
      l = Math.min(l, data[i].low);
      h = Math.max(h, data[i].high);
      const b = ind.bb ? calc.bb[i] : null;
      if (b) {
        l = Math.min(l, b.lower);
        h = Math.max(h, b.upper);
      }
    }
    if (!Number.isFinite(l)) return { lo: 0, hi: 1 };
    const pad = (h - l) * 0.06 || h * 0.01;
    return { lo: l - pad, hi: h + pad };
  }, [iFrom, iTo, data, calc.bb, ind.bb]);
  const yOf = (p: number) => priceTop + ((hi - p) / (hi - lo)) * (priceBottom - priceTop);
  const priceAt = (y: number) => hi - ((y - priceTop) / (priceBottom - priceTop)) * (hi - lo);
  const maxVol = useMemo(() => {
    let m = 1;
    for (let i = iFrom; i <= iTo; i++) m = Math.max(m, data[i].volume);
    return m;
  }, [iFrom, iTo, data]);

  const clampEnd = (end: number, count: number) => Math.min(n - 1 + count * 0.3, Math.max(count * 0.3 - 1, end));

  function zoom(factor: number, anchorX = plotW * 0.85) {
    setView((v) => {
      const count = Math.min(n, Math.max(MIN_COUNT, Math.round(v.count * factor)));
      if (count === v.count) return v;
      const sw = plotW / (v.count + PAD_SLOTS);
      const anchorIdx = v.end - v.count + 1 + anchorX / sw - 0.5;
      const sw2 = plotW / (count + PAD_SLOTS);
      const end = anchorIdx - (anchorX / sw2 - 0.5) + count - 1;
      return { ...v, count, end: clampEnd(end, count) };
    });
  }
  const pan = (candles: number) => setView((v) => ({ ...v, end: clampEnd(v.end + candles, v.count) }));
  const reset = () => setView({ key: viewKey, end: HISTORY - 1, count: DEFAULT_COUNT });

  // Rueda del mouse: zoom anclado en el cursor (listener nativo para poder cancelar el scroll de la página).
  const onWheelZoom = useEffectEvent((deltaY: number, x: number) => zoom(deltaY > 0 ? 1.12 : 1 / 1.12, x));
  useEffect(() => {
    const el = plotRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      onWheelZoom(e.deltaY, Math.min(e.clientX - r.left, r.width - AXIS_W));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // ---------- Interacción ----------
  const drag = useRef<{ x0: number; end0: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const local = (e: PointerEvent) => {
    const r = plotRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    const p = local(e);
    if (p.x > plotW) return;
    if (tool === "cursor") {
      e.currentTarget.setPointerCapture(e.pointerId);
      drag.current = { x0: p.x, end0: view.end };
      setDragging(true);
      return;
    }
    if (p.y > mainH) return;
    const pt = { i: first + p.x / slotW - 0.5, price: Math.round(priceAt(p.y) * 100) / 100 };
    const add = (d: Drawing) => setAllDrawings((all) => ({ ...all, [drawKey]: [...(all[drawKey] ?? []), d] }));
    if (tool === "hline") add({ kind: "hline", price: pt.price });
    else if (tool === "text") {
      const text = window.prompt("Texto de la nota:");
      if (text?.trim()) add({ kind: "text", at: pt, text: text.trim().slice(0, 60) });
    } else if (!pending) setPending(pt);
    else {
      add({ kind: tool, a: pending, b: pt });
      setPending(null);
    }
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const p = local(e);
    setHover(p.x <= plotW && p.y <= size.h - AXIS_H ? p : null);
    if (drag.current) {
      const dx = p.x - drag.current.x0;
      const end = clampEnd(drag.current.end0 - dx / slotW, view.count);
      setView((v) => ({ ...v, end }));
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const actions: Record<string, () => void> = {
      "+": () => zoom(1 / 1.2),
      "=": () => zoom(1 / 1.2),
      "-": () => zoom(1.2),
      ArrowLeft: () => pan(-5),
      ArrowRight: () => pan(5),
      "0": reset,
    };
    const act = actions[e.key];
    if (act && e.target === e.currentTarget) {
      e.preventDefault();
      act();
    }
  }

  // ---------- Cruz de mira y leyenda ----------
  const hoverIdx = hover ? Math.min(n - 1, Math.max(0, Math.round(first + hover.x / slotW - 0.5))) : n - 1;
  const hc = data[hoverIdx];
  const prevClose = data[hoverIdx - 1]?.close ?? hc.open;
  const changePct = (hc.close / prevClose - 1) * 100;

  // ---------- Escalas ----------
  const ticks = niceTicks(lo, hi, Math.max(3, Math.floor((priceBottom - priceTop) / 45)));
  // Marcas de tiempo: primero la apertura de cada rueda (se etiqueta con la fecha) y después
  // horarios intermedios, sin que se pisen entre sí.
  const labelEvery = Math.max(1, Math.ceil(78 / slotW));
  const minGap = labelEvery * 0.75;
  const startIdx = Math.max(0, Math.ceil(first));
  const timeTicks: number[] = [];
  const far = (i: number) => timeTicks.every((t) => Math.abs(t - i) >= minGap);
  for (let i = startIdx; i <= iTo; i++) if (opensSession(frame, i, n) && far(i)) timeTicks.push(i);
  for (let i = startIdx; i <= iTo; i++) if (i % labelEvery === 0 && far(i)) timeTicks.push(i);
  timeTicks.sort((a, b) => a - b);
  // Sin etiquetas pegadas a los bordes (quedarían cortadas).
  const visibleTicks = timeTicks.filter((i) => xOf(i) > 26 && xOf(i) < plotW - 26);

  // ---------- Líneas de orden ----------
  const orderLines =
    levels && onLevelsChange
      ? [
          {
            id: "entry",
            label: levels.type === "Mercado" ? "Mercado" : "Entrada",
            value: levels.type === "Mercado" ? instrument.price : levels.price,
            color: "var(--color-primary-strong)",
            onChange: (price: number) => onLevelsChange({ ...levels, price, type: levels.type === "Mercado" ? "Límite" : levels.type }),
          },
          ...(levels.bracket
            ? [
                { id: "stop", label: "SL", value: levels.bracket.stop, color: DOWN, onChange: (stop: number) => onLevelsChange({ ...levels, bracket: { ...levels.bracket!, stop } }) },
                { id: "target", label: "TP", value: levels.bracket.target, color: UP, onChange: (target: number) => onLevelsChange({ ...levels, bracket: { ...levels.bracket!, target } }) },
              ]
            : []),
        ]
      : [];
  const clampY = (y: number) => Math.min(priceBottom, Math.max(priceTop, y));

  // ---------- Render de la serie principal ----------
  const bodyW = Math.max(1, slotW * 0.64);
  const mainSeries: ReactNode[] = [];
  if (type === "line" || type === "area") {
    const d = seriesPath(iFrom, iTo, (i) => data[i].close, xOf, yOf);
    if (type === "area") {
      const lastX = xOf(iTo).toFixed(1);
      const firstX = xOf(iFrom).toFixed(1);
      mainSeries.push(<path key="area" d={`${d} L${lastX} ${priceBottom} L${firstX} ${priceBottom} Z`} fill={`url(#${uid}-area)`} />);
    }
    mainSeries.push(<path key="line" d={d} fill="none" stroke="var(--color-primary-strong)" strokeWidth={2} />);
  } else {
    for (let i = iFrom; i <= iTo; i++) {
      const c = data[i];
      const up = c.close >= c.open;
      const col = up ? UP : DOWN;
      const x = xOf(i);
      if (type === "bars") {
        mainSeries.push(
          <g key={i} stroke={col} strokeWidth={Math.max(1, Math.min(2, slotW * 0.15))}>
            <line x1={x} x2={x} y1={yOf(c.high)} y2={yOf(c.low)} />
            <line x1={x - bodyW / 2} x2={x} y1={yOf(c.open)} y2={yOf(c.open)} />
            <line x1={x} x2={x + bodyW / 2} y1={yOf(c.close)} y2={yOf(c.close)} />
          </g>,
        );
      } else {
        const top = yOf(Math.max(c.open, c.close));
        const bottom = yOf(Math.min(c.open, c.close));
        mainSeries.push(
          <g key={i}>
            <line x1={x} x2={x} y1={yOf(c.high)} y2={yOf(c.low)} stroke={col} />
            <rect x={x - bodyW / 2} y={top} width={bodyW} height={Math.max(1, bottom - top)} fill={col} />
          </g>,
        );
      }
    }
  }

  // ---------- Paneles inferiores ----------
  const paneTops = panes.map((_, k) => mainH + panes.slice(0, k).reduce((a, q) => a + paneH[q], 0));
  const paneNodes = panes.map((p, k) => {
    const top = paneTops[k];
    const h = paneH[p];
    const inner = { top: top + 16, bottom: top + h - 6 };
    if (p === "rsi") {
      const y = (v: number) => inner.top + ((100 - v) / 100) * (inner.bottom - inner.top);
      const v = calc.rsi[hoverIdx];
      return (
        <g key="rsi">
          <line x1={0} x2={size.w} y1={top} y2={top} stroke="var(--color-surface-higher)" />
          <rect x={0} y={y(70)} width={plotW} height={y(30) - y(70)} fill="var(--color-primary)" opacity={0.06} />
          {[70, 30].map((lvl) => (
            <g key={lvl}>
              <line x1={0} x2={plotW} y1={y(lvl)} y2={y(lvl)} stroke="var(--color-fg-subtle)" strokeDasharray="3 3" opacity={0.6} />
              <text x={plotW + 6} y={y(lvl) + 3} className="fill-fg-subtle" fontSize={10}>
                {lvl}
              </text>
            </g>
          ))}
          <path d={seriesPath(iFrom, iTo, (i) => calc.rsi[i], xOf, y)} fill="none" stroke={color("rsi")} strokeWidth={1.5} clipPath={`url(#${uid}-clip)`} />
          <text x={6} y={top + 12} fontSize={10} className="fill-fg-subtle">
            RSI (14) <tspan fill={color("rsi")}>{v === null || v === undefined ? "—" : formatDecimal(v)}</tspan>
          </text>
        </g>
      );
    }
    let mLo = 0;
    let mHi = 0;
    for (let i = iFrom; i <= iTo; i++) {
      const m = calc.macd[i];
      if (!m) continue;
      mLo = Math.min(mLo, m.macd, m.signal ?? 0, m.hist ?? 0);
      mHi = Math.max(mHi, m.macd, m.signal ?? 0, m.hist ?? 0);
    }
    const span = mHi - mLo || 1;
    const y = (v: number) => inner.top + ((mHi - v) / span) * (inner.bottom - inner.top);
    const m = calc.macd[hoverIdx];
    return (
      <g key="macd">
        <line x1={0} x2={size.w} y1={top} y2={top} stroke="var(--color-surface-higher)" />
        <line x1={0} x2={plotW} y1={y(0)} y2={y(0)} stroke="var(--color-fg-subtle)" opacity={0.4} />
        <g clipPath={`url(#${uid}-clip)`}>
          {Array.from({ length: iTo - iFrom + 1 }, (_, k) => {
            const i = iFrom + k;
            const h = calc.macd[i]?.hist;
            if (h === null || h === undefined) return null;
            return <rect key={i} x={xOf(i) - bodyW / 2} y={Math.min(y(0), y(h))} width={bodyW} height={Math.abs(y(h) - y(0)) || 0.5} fill={h >= 0 ? UP : DOWN} opacity={0.45} />;
          })}
          <path d={seriesPath(iFrom, iTo, (i) => calc.macd[i]?.macd, xOf, y)} fill="none" stroke="var(--color-primary-strong)" strokeWidth={1.4} />
          <path d={seriesPath(iFrom, iTo, (i) => calc.macd[i]?.signal, xOf, y)} fill="none" stroke="#f5b942" strokeWidth={1.2} />
        </g>
        <text x={6} y={top + 12} fontSize={10} className="fill-fg-subtle">
          MACD (12, 26, 9){" "}
          <tspan fill="var(--color-primary-strong)">{m ? formatDecimal(m.macd) : "—"}</tspan>{" "}
          <tspan fill="#f5b942">{m?.signal === null || !m ? "—" : formatDecimal(m.signal)}</tspan>{" "}
          <tspan fill={(m?.hist ?? 0) >= 0 ? UP : DOWN}>{m?.hist === null || !m ? "—" : formatDecimal(m.hist)}</tspan>
        </text>
      </g>
    );
  });

  const overlays: { id: IndicatorId; series: Series }[] = (
    [
      ["ema20", calc.ema20],
      ["ema50", calc.ema50],
      ["sma200", calc.sma200],
      ["vwap", calc.vwap],
    ] as [IndicatorId, Series][]
  )
    .filter(([id]) => ind[id])
    .map(([id, series]) => ({ id, series }));

  const lastClose = data[n - 1].close;
  const lastY = yOf(lastClose);
  const lastUp = lastClose >= (data[n - 2]?.close ?? lastClose);
  const cur = instrument.currency === "USD" ? "U$S " : "$";

  const hint =
    tool === "trend" || tool === "measure"
      ? pending
        ? "Hacé clic en el segundo punto"
        : "Hacé clic en el primer punto"
      : tool === "hline"
        ? "Hacé clic en el precio"
        : tool === "text"
          ? "Hacé clic donde va la nota"
          : "";

  function exportCsv() {
    const rows = [];
    for (let i = iFrom; i <= iTo; i++) rows.push([fullTimeLabel(frame, i, n), data[i].open.toFixed(2), data[i].high.toFixed(2), data[i].low.toFixed(2), data[i].close.toFixed(2), data[i].volume]);
    downloadFile(`${symbol}-${frame}_${stamp()}.csv`, toCsv(["fecha", "apertura", "maximo", "minimo", "cierre", "volumen"], rows));
  }

  return (
    <div className={`flex min-h-0 flex-col gap-2 ${className}`}>
      <ChartToolbar
        frame={frame}
        onFrame={(f) => setPrefs((p) => ({ ...p, frame: f }))}
        type={type}
        onType={(t) => setPrefs((p) => ({ ...p, type: t }))}
        indicators={ind}
        onToggle={(id) => setPrefs((p) => ({ ...p, indicators: { ...p.indicators, [id]: !p.indicators[id] } }))}
        onZoomIn={() => zoom(1 / 1.25)}
        onZoomOut={() => zoom(1.25)}
        onReset={reset}
        onExport={exportCsv}
        onExpand={onExpand}
        expanded={expanded}
      />

      <div className="flex min-h-0 flex-1 gap-2">
        <div role="toolbar" aria-label="Herramientas de dibujo" className="hidden flex-col gap-1 sm:flex">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-label={t.label}
              title={t.label}
              aria-pressed={tool === t.id}
              onClick={() => {
                setTool(t.id);
                setPending(null);
              }}
              className={`rounded p-1.5 ${tool === t.id ? "bg-primary-strong/20 text-primary" : "text-fg-subtle hover:bg-surface-high"}`}
            >
              <MsIcon name={t.icon} size={16} />
            </button>
          ))}
          <button
            type="button"
            aria-label="Borrar dibujos"
            title="Borrar dibujos"
            disabled={drawings.length === 0}
            onClick={() => setAllDrawings((d) => ({ ...d, [drawKey]: [] }))}
            className="mt-2 rounded p-1.5 text-fg-subtle hover:bg-surface-high hover:text-negative disabled:opacity-30"
          >
            <MsIcon name="delete" size={16} />
          </button>
        </div>

        <div
          ref={plotRef}
          tabIndex={0}
          role="application"
          aria-label={`Gráfico de ${symbol} en ${frame}. Rueda o + y − para zoom, flechas para desplazar, 0 para ajustar.`}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={() => {
            drag.current = null;
            setDragging(false);
          }}
          onPointerLeave={() => {
            if (!dragging) setHover(null);
          }}
          onDoubleClick={reset}
          className={`relative min-h-0 min-w-0 flex-1 touch-none overflow-hidden rounded-lg bg-surface-lowest outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            dragging ? "cursor-grabbing" : "cursor-crosshair"
          }`}
        >
          <svg width={size.w} height={size.h} className="absolute inset-0 block select-none font-mono" role="img" aria-label={`Velas de ${symbol} en ${frame}`}>
            <defs>
              <clipPath id={`${uid}-clip`}>
                <rect x={0} y={0} width={plotW} height={size.h - AXIS_H} />
              </clipPath>
              <linearGradient id={`${uid}-area`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary-strong)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--color-primary-strong)" stopOpacity={0} />
              </linearGradient>
            </defs>

            {/* Grilla */}
            {ticks.map((t) => (
              <line key={`g${t}`} x1={0} x2={plotW} y1={yOf(t)} y2={yOf(t)} stroke="var(--color-surface-higher)" strokeDasharray="2 4" />
            ))}
            {visibleTicks.map((i) => (
              <line key={`v${i}`} x1={xOf(i)} x2={xOf(i)} y1={0} y2={size.h - AXIS_H} stroke="var(--color-surface-higher)" strokeDasharray="2 4" opacity={0.6} />
            ))}

            <g clipPath={`url(#${uid}-clip)`}>
              {/* Volumen */}
              {volOn &&
                Array.from({ length: iTo - iFrom + 1 }, (_, k) => {
                  const i = iFrom + k;
                  const c = data[i];
                  const h = (c.volume / maxVol) * mainH * 0.17;
                  return <rect key={`vol${i}`} x={xOf(i) - bodyW / 2} y={mainH - h} width={bodyW} height={h} fill={c.close >= c.open ? UP : DOWN} opacity={0.22} />;
                })}

              {/* Bandas de Bollinger */}
              {ind.bb && (
                <>
                  <path
                    d={`${seriesPath(iFrom, iTo, (i) => calc.bb[i]?.upper, xOf, yOf)} ${(() => {
                      let d = "";
                      for (let i = iTo; i >= iFrom; i--) {
                        const b = calc.bb[i];
                        if (b) d += `L${xOf(i).toFixed(1)} ${yOf(b.lower).toFixed(1)} `;
                      }
                      return d;
                    })()}Z`}
                    fill={color("bb")}
                    opacity={0.07}
                  />
                  <path d={seriesPath(iFrom, iTo, (i) => calc.bb[i]?.upper, xOf, yOf)} fill="none" stroke={color("bb")} strokeWidth={1} opacity={0.8} />
                  <path d={seriesPath(iFrom, iTo, (i) => calc.bb[i]?.lower, xOf, yOf)} fill="none" stroke={color("bb")} strokeWidth={1} opacity={0.8} />
                  <path d={seriesPath(iFrom, iTo, (i) => calc.bb[i]?.mid, xOf, yOf)} fill="none" stroke={color("bb")} strokeWidth={1} strokeDasharray="4 3" opacity={0.6} />
                </>
              )}

              {mainSeries}

              {overlays.map((o) => (
                <path key={o.id} d={seriesPath(iFrom, iTo, (i) => o.series[i], xOf, yOf)} fill="none" stroke={color(o.id)} strokeWidth={1.5} />
              ))}

              {/* Dibujos */}
              {drawings.map((d, k) => {
                if (d.kind === "hline")
                  return <line key={k} x1={0} x2={plotW} y1={yOf(d.price)} y2={yOf(d.price)} stroke="#f5b942" strokeWidth={1.5} />;
                if (d.kind === "text")
                  return (
                    <text key={k} x={xOf(d.at.i)} y={yOf(d.at.price)} fontSize={11} className="fill-fg" stroke="var(--color-surface-lowest)" strokeWidth={3} paintOrder="stroke">
                      {d.text}
                    </text>
                  );
                const pct = (d.b.price / d.a.price - 1) * 100;
                return (
                  <g key={k}>
                    <line x1={xOf(d.a.i)} y1={yOf(d.a.price)} x2={xOf(d.b.i)} y2={yOf(d.b.price)} stroke={d.kind === "measure" ? "var(--color-fg-muted)" : "#f5b942"} strokeWidth={1.5} strokeDasharray={d.kind === "measure" ? "4 3" : undefined} />
                    {d.kind === "measure" && (
                      <g transform={`translate(${xOf(d.b.i) + 4} ${yOf(d.b.price) - 20})`}>
                        <rect width={132} height={17} rx={3} fill={pct >= 0 ? UP : DOWN} />
                        <text x={6} y={12} fontSize={10} fontWeight={700} fill={pct >= 0 ? "var(--color-on-positive)" : "white"}>
                          {formatPercent(pct)} · {Math.round(Math.abs(d.b.i - d.a.i))} velas
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
              {pending && <circle cx={xOf(pending.i)} cy={yOf(pending.price)} r={3} fill="#f5b942" />}

              {/* Último precio */}
              <line x1={0} x2={plotW} y1={lastY} y2={lastY} stroke={lastUp ? UP : DOWN} strokeDasharray="4 4" opacity={0.8} />

              {/* Líneas de orden */}
              {orderLines.map((l) => (
                <line key={l.id} x1={0} x2={plotW} y1={clampY(yOf(l.value))} y2={clampY(yOf(l.value))} stroke={l.color} strokeDasharray="6 4" strokeWidth={1.2} />
              ))}
            </g>

            {paneNodes}

            {/* Eje de precios */}
            <rect x={plotW} y={0} width={AXIS_W} height={size.h} className="fill-surface-lowest" />
            <line x1={plotW} x2={plotW} y1={0} y2={size.h - AXIS_H} stroke="var(--color-surface-higher)" />
            {ticks.map((t) => (
              <text key={`t${t}`} x={plotW + 6} y={yOf(t) + 3} fontSize={10} className="fill-fg-subtle">
                {priceText(t)}
              </text>
            ))}
            {hi >= lastClose && lo <= lastClose && (
              <g>
                <rect x={plotW + 1} y={lastY - 8} width={AXIS_W - 2} height={16} rx={2} fill={lastUp ? UP : DOWN} />
                <text x={plotW + 5} y={lastY + 3.5} fontSize={10} fontWeight={700} fill={lastUp ? "var(--color-on-positive)" : "white"}>
                  {priceText(lastClose)}
                </text>
              </g>
            )}

            {/* Eje de tiempo */}
            <line x1={0} x2={size.w} y1={size.h - AXIS_H} y2={size.h - AXIS_H} stroke="var(--color-surface-higher)" />
            {visibleTicks.map((i) => (
              <text key={`tt${i}`} x={xOf(i)} y={size.h - 7} fontSize={10} textAnchor="middle" className="fill-fg-subtle">
                {timeLabel(frame, i, n)}
              </text>
            ))}

            {/* Cruz de mira */}
            {hover && (
              <g pointerEvents="none">
                <line x1={xOf(hoverIdx)} x2={xOf(hoverIdx)} y1={0} y2={size.h - AXIS_H} stroke="var(--color-fg-subtle)" strokeDasharray="3 3" />
                <line x1={0} x2={plotW} y1={hover.y} y2={hover.y} stroke="var(--color-fg-subtle)" strokeDasharray="3 3" />
                {hover.y <= mainH && (
                  <g>
                    <rect x={plotW + 1} y={hover.y - 8} width={AXIS_W - 2} height={16} rx={2} className="fill-surface-highest" />
                    <text x={plotW + 5} y={hover.y + 3.5} fontSize={10} className="fill-fg">
                      {priceText(priceAt(hover.y))}
                    </text>
                  </g>
                )}
                <g transform={`translate(${Math.min(plotW - 118, Math.max(0, xOf(hoverIdx) - 59))} ${size.h - AXIS_H + 2})`}>
                  <rect width={118} height={AXIS_H - 4} rx={2} className="fill-surface-highest" />
                  <text x={59} y={12.5} fontSize={10} textAnchor="middle" className="fill-fg">
                    {fullTimeLabel(frame, hoverIdx, n)}
                  </text>
                </g>
              </g>
            )}
          </svg>

          {/* Leyenda (HTML sobre el gráfico) */}
          <div className="pointer-events-none absolute top-1.5 left-2 flex max-w-[calc(100%-5rem)] flex-col gap-0.5 font-mono text-[11px]">
            <p className="flex flex-wrap items-center gap-x-2">
              <span className="font-bold text-fg">
                {symbol} · {frame} · {CHART_TYPES.find((t) => t.id === type)?.label}
              </span>
              <span className="text-fg-subtle">
                A <span className="text-fg">{formatDecimal(hc.open)}</span> Máx <span className="text-fg">{formatDecimal(hc.high)}</span> Mín{" "}
                <span className="text-fg">{formatDecimal(hc.low)}</span> C <span className="text-fg">{formatDecimal(hc.close)}</span>
              </span>
              <span className={changePct >= 0 ? "text-positive" : "text-negative"}>{formatPercent(changePct)}</span>
              {volOn && <span className="text-fg-subtle">Vol {formatInteger(hc.volume)}</span>}
            </p>
            {(overlays.length > 0 || ind.bb) && (
              <p className="flex flex-wrap gap-x-3">
                {overlays.map((o) => {
                  const v = o.series[hoverIdx];
                  return (
                    <span key={o.id} style={{ color: color(o.id) }}>
                      {INDICATORS.find((x) => x.id === o.id)?.label} {v === null || v === undefined ? "—" : formatDecimal(v)}
                    </span>
                  );
                })}
                {ind.bb && calc.bb[hoverIdx] && (
                  <span style={{ color: color("bb") }}>
                    BB {formatDecimal(calc.bb[hoverIdx]!.upper)} / {formatDecimal(calc.bb[hoverIdx]!.lower)}
                  </span>
                )}
              </p>
            )}
          </div>

          {hint && <span className="pointer-events-none absolute bottom-7 left-2 rounded bg-surface-higher/90 px-1.5 py-0.5 text-[10px] text-fg-muted">{hint}</span>}

          {/* Etiquetas arrastrables de las líneas de orden */}
          {orderLines.map((l) => {
            const y = yOf(l.value);
            const outside = y < priceTop || y > priceBottom;
            return (
              <OrderHandle
                key={l.id}
                label={`${l.label} ${formatDecimal(l.value)}${outside ? (y < priceTop ? " ▲" : " ▼") : ""}`}
                ariaLabel={`${l.label}: arrastrá para ajustar`}
                value={l.value}
                lo={lo}
                hi={hi}
                top={clampY(y)}
                right={AXIS_W + 4}
                color={l.color}
                onDrag={(clientY) => {
                  const r = plotRef.current!.getBoundingClientRect();
                  const p = Math.min(hi, Math.max(lo, priceAt(clientY - r.top)));
                  l.onChange(Math.round(p * 100) / 100);
                }}
                onStep={(dir, big) => l.onChange(Math.round((l.value + dir * (hi - lo) * (big ? 0.1 : 0.01)) * 100) / 100)}
              />
            );
          })}
        </div>
      </div>

      <p className="text-label flex flex-wrap gap-x-3 text-fg-subtle">
        <span>
          {cur}
          {formatDecimal(instrument.price)} · Fuente: Feed Directo BYMA DMA (demo)
        </span>
        <span>Rueda: zoom · Arrastrar: desplazar · Doble clic: ajustar</span>
        {orderLines.length > 0 && <span className="text-primary">Arrastrá las etiquetas para ajustar precio, stop y target.</span>}
      </p>
    </div>
  );
}

function OrderHandle({
  label,
  ariaLabel,
  value,
  lo,
  hi,
  top,
  right,
  color: c,
  onDrag,
  onStep,
}: {
  label: string;
  ariaLabel: string;
  value: number;
  lo: number;
  hi: number;
  top: number;
  right: number;
  color: string;
  onDrag: (clientY: number) => void;
  onStep: (dir: 1 | -1, big: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="slider"
      aria-label={ariaLabel}
      aria-valuemin={Math.round(lo * 100) / 100}
      aria-valuemax={Math.round(hi * 100) / 100}
      aria-valuenow={value}
      aria-valuetext={formatDecimal(value)}
      onPointerDown={(e) => {
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) onDrag(e.clientY);
      }}
      onKeyDown={(e) => {
        if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
        e.preventDefault();
        e.stopPropagation();
        onStep(e.key === "ArrowUp" ? 1 : -1, e.shiftKey);
      }}
      style={{ top, right, background: c }}
      className="absolute -translate-y-1/2 cursor-ns-resize touch-none rounded px-1.5 py-0.5 font-mono text-[10px] font-bold text-white select-none focus-visible:ring-2 focus-visible:ring-fg"
    >
      {label}
    </button>
  );
}

function ChartToolbar({
  frame,
  onFrame,
  type,
  onType,
  indicators,
  onToggle,
  onZoomIn,
  onZoomOut,
  onReset,
  onExport,
  onExpand,
  expanded,
}: {
  frame: Frame;
  onFrame: (f: Frame) => void;
  type: string;
  onType: (t: (typeof CHART_TYPES)[number]["id"]) => void;
  indicators: Record<IndicatorId, boolean>;
  onToggle: (id: IndicatorId) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onExport: () => void;
  onExpand?: () => void;
  expanded: boolean;
}) {
  const { open: menuOpen, setOpen: setMenuOpen, ref: menuRef } = usePopover();
  const active = INDICATORS.filter((i) => indicators[i.id]).length;
  const iconBtn = "rounded-md p-1.5 text-fg-muted hover:bg-surface-high hover:text-fg";

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Tabs size="sm" label="Temporalidad" value={frame} onChange={onFrame} items={FRAMES.map((f) => ({ id: f, label: f }))} />
        <label className="sr-only" htmlFor="chart-type">
          Tipo de gráfico
        </label>
        <select id="chart-type" value={type} onChange={(e) => onType(e.target.value as (typeof CHART_TYPES)[number]["id"])} className="rounded-md bg-surface-high px-2 py-1 text-xs text-fg">
          {CHART_TYPES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
        <div ref={menuRef} className="relative">
          <button type="button" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)} className="flex items-center gap-1 rounded-md bg-surface-high px-2 py-1 text-xs text-fg hover:bg-surface-higher">
            <MsIcon name="monitoring" size={14} />
            Indicadores <span className="text-label rounded bg-surface-highest px-1 text-fg-subtle">{active}</span>
          </button>
          {menuOpen && (
            <div className="absolute top-full left-0 z-30 mt-1 w-64 rounded-xl border border-surface-highest bg-surface-higher p-2 shadow-2xl">
              <p className="text-label px-1 pb-1 uppercase text-fg-subtle">En el gráfico</p>
              {INDICATORS.filter((i) => !i.pane).map((i) => (
                <IndicatorRow key={i.id} label={i.label} color={i.color} checked={indicators[i.id]} onChange={() => onToggle(i.id)} />
              ))}
              <p className="text-label px-1 pt-2 pb-1 uppercase text-fg-subtle">Paneles inferiores</p>
              {INDICATORS.filter((i) => i.pane).map((i) => (
                <IndicatorRow key={i.id} label={i.label} color={i.color} checked={indicators[i.id]} onChange={() => onToggle(i.id)} />
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-0.5">
        <button type="button" aria-label="Alejar" title="Alejar (−)" onClick={onZoomOut} className={iconBtn}>
          <MsIcon name="zoom_out" size={16} />
        </button>
        <button type="button" aria-label="Acercar" title="Acercar (+)" onClick={onZoomIn} className={iconBtn}>
          <MsIcon name="zoom_in" size={16} />
        </button>
        <button type="button" aria-label="Ajustar vista" title="Ajustar vista (0 o doble clic)" onClick={onReset} className={iconBtn}>
          <MsIcon name="fit_screen" size={16} />
        </button>
        <button type="button" aria-label="Descargar datos del gráfico (CSV)" title="Descargar datos (CSV)" onClick={onExport} className={iconBtn}>
          <MsIcon name="download" size={16} />
        </button>
        {onExpand && (
          <button
            type="button"
            onClick={onExpand}
            aria-label={expanded ? "Salir de la vista ampliada" : "Ampliar gráfico"}
            title={expanded ? "Salir (Esc)" : "Ampliar gráfico"}
            className="ml-1 flex items-center gap-1 rounded-md bg-primary-strong px-2 py-1 text-xs font-semibold text-on-primary hover:opacity-90"
          >
            <MsIcon name={expanded ? "close_fullscreen" : "open_in_full"} size={14} />
            {expanded ? "Salir" : "Ampliar"}
          </button>
        )}
      </div>
    </div>
  );
}

function IndicatorRow({ label, color: c, checked, onChange }: { label: string; color: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-xs hover:bg-surface-highest">
      <input type="checkbox" checked={checked} onChange={onChange} className="accent-primary-strong" />
      <span aria-hidden className="h-0.5 w-4 rounded" style={{ background: c }} />
      {label}
    </label>
  );
}
