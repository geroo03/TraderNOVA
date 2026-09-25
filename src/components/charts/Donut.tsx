import type { ReactNode } from "react";

interface Slice {
  value: number;
  color: string;
}

interface DonutProps {
  slices: Slice[];
  size?: number;
  thickness?: number;
  children?: ReactNode;
  label: string;
}

/** Donut en SVG con stroke-dasharray: cada segmento es un arco del mismo círculo. */
export function Donut({ slices, size = 192, thickness = 22, children, label }: DonutProps) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const total = slices.reduce((a, s) => a + s.value, 0) || 1;
  // Longitud de cada arco y dónde empieza (suma de los anteriores), calculado sin mutar durante el render.
  const arcs = slices.map((s) => (s.value / total) * c);
  const starts = arcs.map((_, i) => arcs.slice(0, i).reduce((a, b) => a + b, 0));

  return (
    <figure className="relative" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-surface-high)" strokeWidth={thickness} />
        {slices.map((s, i) => (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={thickness}
              strokeDasharray={`${arcs[i]} ${c - arcs[i]}`}
              strokeDashoffset={-starts[i]}
            />
        ))}
      </svg>
      {children && <figcaption className="absolute inset-0 flex flex-col items-center justify-center">{children}</figcaption>}
    </figure>
  );
}
