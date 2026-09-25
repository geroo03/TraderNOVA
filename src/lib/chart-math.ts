export interface Point {
  x: number;
  y: number;
}

export interface Ohlc {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/** Mapea `values` a coordenadas dentro de un viewBox width×height (y invertido). */
export function toPoints(values: number[], width: number, height: number, min?: number, max?: number): Point[] {
  if (values.length === 0) return [];
  const lo = min ?? Math.min(...values);
  const hi = max ?? Math.max(...values);
  const span = hi - lo || 1;
  const step = values.length > 1 ? width / (values.length - 1) : 0;
  return values.map((v, i) => ({ x: i * step, y: height - ((v - lo) / span) * height }));
}

/** Línea recta entre puntos. */
export function linePath(points: Point[]): string {
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");
}

/**
 * Curva suave (Catmull-Rom convertida a Bézier cúbica). `tension` 0 = recta, 1 = muy curva.
 * Se usa para los gráficos de patrimonio/índices, donde la forma importa más que el punto exacto.
 */
export function smoothPath(points: Point[], tension = 0.5): string {
  if (points.length < 3) return linePath(points);
  const t = tension / 6;
  let d = `M${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1 = { x: p1.x + (p2.x - p0.x) * t * 2, y: p1.y + (p2.y - p0.y) * t * 2 };
    const c2 = { x: p2.x - (p3.x - p1.x) * t * 2, y: p2.y - (p3.y - p1.y) * t * 2 };
    d += ` C${c1.x.toFixed(2)} ${c1.y.toFixed(2)} ${c2.x.toFixed(2)} ${c2.y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

/** Cierra un path de línea hacia la base para rellenar el área. */
export function areaPath(line: string, points: Point[], height: number): string {
  if (points.length === 0) return "";
  const last = points[points.length - 1];
  return `${line} L${last.x.toFixed(2)} ${height} L${points[0].x.toFixed(2)} ${height} Z`;
}

/** Media móvil simple; los primeros `period - 1` valores usan la media parcial. */
export function movingAverage(values: number[], period: number): number[] {
  return values.map((_, i) => {
    const from = Math.max(0, i - period + 1);
    const slice = values.slice(from, i + 1);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });
}
