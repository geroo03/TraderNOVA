interface BarChartProps {
  /** Cada barra puede apilar varios valores (en el orden de `colors`). */
  data: { label: string; values: number[] }[];
  colors: string[];
  className?: string;
  label: string;
}

/** Barras verticales apiladas en SVG. Las etiquetas del eje X van en HTML para que no se deformen. */
export function BarChart({ data, colors, className = "h-40", label }: BarChartProps) {
  const W = 100 * data.length;
  const H = 100;
  const max = Math.max(...data.map((d) => d.values.reduce((a, b) => a + b, 0))) || 1;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label={label} className="min-h-0 w-full flex-1">
        {data.map((d, i) => {
          const heights = d.values.map((v) => (v / max) * (H - 4));
          // Cada segmento arranca donde terminó la suma de los anteriores (apilado desde abajo).
          const tops = heights.map((_, j) => H - heights.slice(0, j + 1).reduce((a, b) => a + b, 0));
          return (
            <g key={d.label}>
              {heights.map((h, j) => (
                <rect key={j} x={i * 100 + 18} y={tops[j]} width={64} height={h} rx={3} fill={colors[j]} />
              ))}
            </g>
          );
        })}
      </svg>
      <div className="flex justify-between font-mono text-[10px] text-fg-subtle">
        {data.map((d, i) => (
          <span key={d.label} className={i % 2 ? "invisible sm:visible" : ""}>
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}
