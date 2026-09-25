"use client";

import { useRef, type KeyboardEvent, type PointerEvent } from "react";
import { formatDecimal } from "@/lib/format";

export interface ChartLine {
  id: string;
  label: string;
  value: number;
  /** Clases de color (fondo de la etiqueta y borde de la línea). */
  tone: "primary" | "negative" | "positive";
  onChange: (value: number) => void;
}

interface ChartOrderLinesProps {
  lines: ChartLine[];
  lo: number;
  hi: number;
  /** Fracción superior de la altura que ocupan las velas (el resto es volumen). */
  priceFraction: number;
}

const toneCls: Record<ChartLine["tone"], { line: string; tag: string }> = {
  primary: { line: "border-primary-strong", tag: "bg-primary-strong text-on-primary" },
  negative: { line: "border-alert", tag: "bg-alert text-white" },
  positive: { line: "border-positive", tag: "bg-positive text-on-positive" },
};

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Líneas de orden sobre el gráfico (estilo "Chart Trader"): se arrastran con el mouse o el dedo,
 * o se mueven con las flechas del teclado. Van en HTML y no dentro del SVG porque el gráfico
 * se estira (preserveAspectRatio="none") y deformaría el texto.
 */
export function ChartOrderLines({ lines, lo, hi, priceFraction }: ChartOrderLinesProps) {
  const ref = useRef<HTMLDivElement>(null);
  const span = hi - lo || 1;
  const clamp = (v: number) => Math.min(hi, Math.max(lo, v));
  const topPct = (v: number) => ((hi - clamp(v)) / span) * priceFraction * 100;

  function valueAt(clientY: number): number {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect || rect.height === 0) return lo;
    const f = (clientY - rect.top) / (rect.height * priceFraction);
    return round2(clamp(hi - f * span));
  }

  function onPointerDown(e: PointerEvent<HTMLElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(line: ChartLine, e: PointerEvent<HTMLElement>) {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) line.onChange(valueAt(e.clientY));
  }

  function onKeyDown(line: ChartLine, e: KeyboardEvent<HTMLElement>) {
    const step = span / 100;
    const delta = e.key === "ArrowUp" ? step : e.key === "ArrowDown" ? -step : 0;
    if (!delta) return;
    e.preventDefault();
    line.onChange(round2(clamp(line.value + delta * (e.shiftKey ? 10 : 1))));
  }

  return (
    <div ref={ref} className="pointer-events-none absolute inset-0">
      {lines.map((line) => {
        const cls = toneCls[line.tone];
        const outside = line.value > hi || line.value < lo;
        return (
          <div key={line.id} className="absolute inset-x-0" style={{ top: `${topPct(line.value)}%` }}>
            <div className={`border-t border-dashed ${cls.line}`} />
            <button
              type="button"
              role="slider"
              aria-label={`${line.label}: arrastrá para ajustar`}
              aria-valuemin={round2(lo)}
              aria-valuemax={round2(hi)}
              aria-valuenow={line.value}
              aria-valuetext={formatDecimal(line.value)}
              onPointerDown={onPointerDown}
              onPointerMove={(e) => onPointerMove(line, e)}
              onKeyDown={(e) => onKeyDown(line, e)}
              className={`pointer-events-auto absolute right-0 -translate-y-1/2 cursor-ns-resize touch-none rounded px-1.5 py-0.5 font-mono text-[10px] font-bold select-none focus-visible:ring-2 focus-visible:ring-fg ${cls.tag}`}
            >
              {line.label} {formatDecimal(line.value)}
              {outside && (line.value > hi ? " ▲" : " ▼")}
            </button>
          </div>
        );
      })}
    </div>
  );
}
