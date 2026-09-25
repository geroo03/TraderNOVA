import { useId } from "react";
import { areaPath, linePath, smoothPath, toPoints } from "@/lib/chart-math";

export interface Series {
  values: number[];
  /** Cualquier color CSS; usar tokens: "var(--color-primary-strong)". */
  color: string;
  area?: boolean;
  dashed?: boolean;
  width?: number;
  opacity?: number;
}

interface LineChartProps {
  series: Series[];
  width?: number;
  height?: number;
  smooth?: boolean;
  /** Líneas horizontales de referencia (cantidad). */
  gridLines?: number;
  /** Marca el último punto de la primera serie. */
  endDot?: boolean;
  className?: string;
  label: string;
}

/**
 * Gráfico de líneas/área en SVG puro, escalable (preserveAspectRatio="none").
 * Todas las series comparten escala Y para que la comparación sea honesta.
 */
export function LineChart({
  series,
  width = 600,
  height = 200,
  smooth = true,
  gridLines = 0,
  endDot = false,
  className = "",
  label,
}: LineChartProps) {
  const gid = useId().replace(/:/g, "");
  const all = series.flatMap((s) => s.values);
  const min = Math.min(...all);
  const max = Math.max(...all);
  const pad = (max - min) * 0.08;
  const lo = min - pad;
  const hi = max + pad;

  const first = series[0] ? toPoints(series[0].values, width, height, lo, hi) : [];
  const lastPoint = first[first.length - 1];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={label}
      className={`block h-full w-full overflow-visible ${className}`}
    >
      {Array.from({ length: gridLines }, (_, i) => {
        const y = ((i + 1) * height) / (gridLines + 1);
        return (
          <line key={i} x1={0} x2={width} y1={y} y2={y} stroke="var(--color-surface-higher)" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
        );
      })}
      {series.map((s, i) => {
        const pts = toPoints(s.values, width, height, lo, hi);
        const d = smooth ? smoothPath(pts) : linePath(pts);
        return (
          <g key={i} opacity={s.opacity ?? 1}>
            {s.area && (
              <>
                <defs>
                  <linearGradient id={`${gid}-${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor={s.color} stopOpacity={0.32} />
                    <stop offset="0.6" stopColor={s.color} stopOpacity={0.08} />
                    <stop offset="1" stopColor={s.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <path d={areaPath(d, pts, height)} fill={`url(#${gid}-${i})`} />
              </>
            )}
            <path
              d={d}
              fill="none"
              stroke={s.color}
              strokeWidth={s.width ?? 2}
              strokeDasharray={s.dashed ? "4 4" : undefined}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </g>
        );
      })}
      {endDot && lastPoint && series[0] && (
        <circle cx={lastPoint.x} cy={lastPoint.y} r={4} fill={series[0].color} vectorEffect="non-scaling-stroke" />
      )}
    </svg>
  );
}

export function Sparkline({ values, color, className = "h-8 w-28", label = "Tendencia" }: { values: number[]; color: string; className?: string; label?: string }) {
  return (
    <div className={className}>
      <LineChart series={[{ values, color, area: true, width: 1.5 }]} width={120} height={32} smooth={false} label={label} />
    </div>
  );
}
