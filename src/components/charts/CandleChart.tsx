import { movingAverage, smoothPath, toPoints, type Ohlc } from "@/lib/chart-math";

interface CandleChartProps {
  data: Ohlc[];
  /** Períodos de medias móviles a superponer. */
  averages?: { period: number; color: string }[];
  showVolume?: boolean;
  /** Línea horizontal punteada en el último precio. */
  lastPriceLine?: boolean;
  className?: string;
  label: string;
}

const W = 800;
const PRICE_H = 300;
const VOL_H = 60;

/**
 * Escala vertical del gráfico: rango de precios y fracción de la altura que ocupan las velas.
 * Se exporta para poder superponer elementos HTML alineados con el SVG.
 */
export function candleScale(data: Ohlc[], showVolume = true) {
  const lo = Math.min(...data.map((d) => d.low));
  const hi = Math.max(...data.map((d) => d.high));
  const height = PRICE_H + (showVolume ? VOL_H + 8 : 0);
  return { lo, hi, height, priceFraction: PRICE_H / height };
}

/** Velas japonesas + volumen en SVG. Verde = cierre ≥ apertura. */
export function CandleChart({ data, averages = [], showVolume = true, lastPriceLine = true, className = "", label }: CandleChartProps) {
  const { lo, hi, height } = candleScale(data, showVolume);
  const span = hi - lo || 1;
  const y = (v: number) => PRICE_H - ((v - lo) / span) * PRICE_H;
  const slot = W / data.length;
  const body = Math.max(2, slot * 0.6);
  const maxVol = Math.max(...data.map((d) => d.volume));
  const last = data[data.length - 1];

  return (
    <svg viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" role="img" aria-label={label} className={`block h-full w-full ${className}`}>
      {[0.2, 0.4, 0.6, 0.8].map((f) => (
        <line key={f} x1={0} x2={W} y1={PRICE_H * f} y2={PRICE_H * f} stroke="var(--color-surface-higher)" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
      ))}
      {data.map((d, i) => {
        const up = d.close >= d.open;
        const color = up ? "var(--color-positive)" : "var(--color-alert)";
        const cx = i * slot + slot / 2;
        const top = y(Math.max(d.open, d.close));
        const bottom = y(Math.min(d.open, d.close));
        return (
          <g key={i}>
            <line x1={cx} x2={cx} y1={y(d.high)} y2={y(d.low)} stroke={color} vectorEffect="non-scaling-stroke" />
            <rect x={cx - body / 2} y={top} width={body} height={Math.max(1, bottom - top)} fill={color} rx={0.5} />
            {showVolume && (
              <rect
                x={cx - body / 2}
                y={height - (d.volume / maxVol) * VOL_H}
                width={body}
                height={(d.volume / maxVol) * VOL_H}
                fill={color}
                opacity={0.25}
              />
            )}
          </g>
        );
      })}
      {averages.map((a) => {
        const values = movingAverage(data.map((d) => d.close), a.period);
        const pts = toPoints(values, W - slot, PRICE_H, lo, hi).map((p) => ({ x: p.x + slot / 2, y: p.y }));
        return <path key={a.period} d={smoothPath(pts, 0.3)} fill="none" stroke={a.color} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />;
      })}
      {lastPriceLine && last && (
        <line x1={0} x2={W} y1={y(last.close)} y2={y(last.close)} stroke="var(--color-positive)" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" opacity={0.7} />
      )}
    </svg>
  );
}
