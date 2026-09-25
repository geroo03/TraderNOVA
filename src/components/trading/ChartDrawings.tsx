"use client";

import { useState, type MouseEvent } from "react";
import { formatDecimal, formatPercent } from "@/lib/format";

export type DrawTool = "cursor" | "trend" | "hline" | "measure" | "text";

interface Pt {
  /** Posición horizontal como fracción del ancho (0..1). */
  x: number;
  price: number;
}

export type Drawing =
  | { kind: "trend" | "measure"; a: Pt; b: Pt }
  | { kind: "hline"; price: number }
  | { kind: "text"; at: Pt; text: string };

interface ChartDrawingsProps {
  tool: DrawTool;
  drawings: Drawing[];
  onAdd: (d: Drawing) => void;
  lo: number;
  hi: number;
  priceFraction: number;
}

/**
 * Capa de dibujo sobre el gráfico de velas. Las líneas van en un SVG estirado (con trazo que no
 * escala) y los textos en HTML para que no se deformen.
 */
export function ChartDrawings({ tool, drawings, onAdd, lo, hi, priceFraction }: ChartDrawingsProps) {
  const [pending, setPending] = useState<Pt | null>(null);
  const span = hi - lo || 1;
  const yPct = (price: number) => ((hi - price) / span) * priceFraction * 100;

  function pointAt(e: MouseEvent<HTMLDivElement>): Pt {
    const r = e.currentTarget.getBoundingClientRect();
    const fy = (e.clientY - r.top) / (r.height * priceFraction);
    return { x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), price: Math.round((hi - fy * span) * 100) / 100 };
  }

  function handleClick(e: MouseEvent<HTMLDivElement>) {
    const p = pointAt(e);
    if (tool === "hline") return onAdd({ kind: "hline", price: p.price });
    if (tool === "text") {
      const text = window.prompt("Texto de la nota:");
      if (text?.trim()) onAdd({ kind: "text", at: p, text: text.trim().slice(0, 60) });
      return;
    }
    if (tool === "trend" || tool === "measure") {
      if (!pending) return setPending(p);
      onAdd({ kind: tool, a: pending, b: p });
      setPending(null);
    }
  }

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

  return (
    <>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden className="pointer-events-none absolute inset-0 h-full w-full">
        {drawings.map((d, i) =>
          d.kind === "hline" ? (
            <line key={i} x1={0} x2={100} y1={yPct(d.price)} y2={yPct(d.price)} stroke="#f5b942" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
          ) : d.kind === "text" ? null : (
            <line
              key={i}
              x1={d.a.x * 100}
              x2={d.b.x * 100}
              y1={yPct(d.a.price)}
              y2={yPct(d.b.price)}
              stroke={d.kind === "measure" ? "var(--color-fg-muted)" : "#f5b942"}
              strokeDasharray={d.kind === "measure" ? "4 3" : undefined}
              strokeWidth={1.5}
              vectorEffect="non-scaling-stroke"
            />
          ),
        )}
        {pending && <circle cx={pending.x * 100} cy={yPct(pending.price)} r={0.8} fill="#f5b942" />}
      </svg>
      {drawings.map((d, i) => {
        if (d.kind === "text")
          return (
            <span key={i} className="pointer-events-none absolute rounded bg-surface-higher/90 px-1.5 py-0.5 text-[11px] text-fg" style={{ left: `${d.at.x * 100}%`, top: `${yPct(d.at.price)}%` }}>
              {d.text}
            </span>
          );
        if (d.kind === "measure") {
          const pct = (d.b.price / d.a.price - 1) * 100;
          return (
            <span
              key={i}
              className={`pointer-events-none absolute -translate-y-full rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${pct >= 0 ? "bg-positive text-on-positive" : "bg-alert text-white"}`}
              style={{ left: `${d.b.x * 100}%`, top: `${yPct(d.b.price)}%` }}
            >
              {formatPercent(pct)} · {formatDecimal(d.b.price - d.a.price)}
            </span>
          );
        }
        if (d.kind === "hline")
          return (
            <span key={i} className="pointer-events-none absolute left-1 -translate-y-full font-mono text-[10px] text-[#f5b942]" style={{ top: `${yPct(d.price)}%` }}>
              {formatDecimal(d.price)}
            </span>
          );
        return null;
      })}
      {tool !== "cursor" && (
        <div role="presentation" onClick={handleClick} className="absolute inset-0 cursor-crosshair">
          <span className="pointer-events-none absolute top-1 left-1 rounded bg-surface-higher/90 px-1.5 py-0.5 text-[10px] text-fg-muted">{hint}</span>
        </div>
      )}
    </>
  );
}
