import { Icon } from "@/components/ui/Icon";
import { Badge, StatusDot, type Tone } from "@/components/ui/Badge";

interface ShowcaseTicker {
  symbol: string;
  market: string;
  marketTone: Tone;
  price: string;
  change: string;
}

// Contenido de marketing del panel derecho, tal cual el Figma.
const tickers: ShowcaseTicker[] = [
  { symbol: "GGAL", market: "BYMA", marketTone: "positive", price: "$4.890,00", change: "+3,65%" },
  { symbol: "AL30D", market: "CI", marketTone: "neutral", price: "u$s 58,40", change: "+1,40%" },
  { symbol: "NVDA", market: "CEDEAR", marketTone: "primary", price: "$18.420,00", change: "+2,80%" },
];

const metrics = [
  { label: "Volumen operado", value: "$48.210M ARS", className: "text-fg" },
  { label: "Latencia DMA FIX", value: "< 9.4 ms", className: "text-positive" },
  { label: "Ratio alza / baja", value: "68% Bullish", className: "text-primary" },
];

const avatars = [
  { initials: "JM", className: "bg-primary text-on-primary" },
  { initials: "SL", className: "bg-positive text-on-positive" },
  { initials: "AR", className: "bg-primary-strong text-on-primary" },
];

/** Panel derecho del login. Oculto en pantallas chicas: es decorativo. */
export function MarketShowcase() {
  return (
    <aside className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-surface-high p-12 lg:flex">
      <div aria-hidden className="absolute -top-24 -right-24 size-96 rounded-full bg-primary/10 blur-[32px]" />
      <div aria-hidden className="absolute bottom-0 left-0 size-80 rounded-full bg-positive/10 blur-[32px]" />

      <div className="relative flex flex-col gap-2 pb-3">
        <div className="flex items-center gap-2">
          <Badge tone="positive" pill className="bg-surface-higher px-2.5 py-1 uppercase">
            <StatusDot /> Mercado abierto BYMA
          </Badge>
          <Badge className="bg-surface-highest px-2 uppercase">DMA FIX 4.4</Badge>
        </div>
        <p className="flex w-fit items-center gap-3 rounded-full bg-surface px-3 py-1 font-mono text-xs font-medium text-fg-muted">
          Dólar MEP: <span className="font-semibold text-positive">$1.182,50</span>
          <span aria-hidden className="text-base text-outline">•</span>
          CCL: <span className="font-semibold text-primary">$1.218,20</span>
        </p>
      </div>

      <div className="relative flex flex-1 flex-col justify-center gap-4 py-[51px]">
        <ul className="grid grid-cols-3 gap-2">
          {tickers.map((t) => (
            <li key={t.symbol} className="flex flex-col gap-1 rounded-lg bg-surface-higher p-3 shadow-card">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold">{t.symbol}</span>
                <Badge tone={t.marketTone} className="px-1 py-0">
                  {t.market}
                </Badge>
              </div>
              <span className="font-mono text-sm font-medium tracking-[-0.35px]">{t.price}</span>
              <span className="flex items-center gap-0.5 font-mono text-xs font-medium text-positive">
                <Icon name="icon-trend-up-small" width={12} height={7} />
                {t.change}
              </span>
            </li>
          ))}
        </ul>

        <figure className="flex flex-col gap-3 overflow-hidden rounded-xl bg-surface-lowest p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusDot size={8} />
              <figcaption className="text-lg font-semibold tracking-[-0.18px]">Índice S&amp;P Merval</figcaption>
              <span className="text-label text-fg-muted">2.148.910,24 PTS</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="rounded bg-surface-high px-2 py-0.5 font-mono text-xs font-semibold text-positive">+4,12% HOY</span>
              <span className="text-label rounded bg-surface-higher px-2 py-0.5 text-fg-muted">1D</span>
              <span className="text-label rounded bg-surface-high px-2 py-0.5 text-fg-muted">1M</span>
              <span className="text-label rounded bg-surface-high px-2 py-0.5 text-fg-muted">1A</span>
            </div>
          </div>
          <div className="relative h-44">
            <Icon name="login-merval-chart" width={524} height={176} className="h-full w-full" />
            <div className="absolute top-3 right-10 flex items-end gap-2 rounded bg-surface-highest/95 px-2.5 pt-2.5 pb-1.5 shadow-xl backdrop-blur-[6px]">
              <span className="text-label text-fg-muted">MAX 52W:</span>
              <span className="font-mono text-xs font-semibold text-positive">$2.160.400</span>
            </div>
          </div>
          <dl className="grid grid-cols-3 gap-2 pt-4">
            {metrics.map((m) => (
              <div key={m.label}>
                <dt className="text-label uppercase text-fg-muted">{m.label}</dt>
                <dd className={`font-mono text-xs font-semibold ${m.className}`}>{m.value}</dd>
              </div>
            ))}
          </dl>
        </figure>

        <div className="flex flex-col gap-1.5">
          <h2 className="text-[32px] leading-10 font-bold tracking-[-0.8px]">
            Operá el mercado local y global con precisión institucional.
          </h2>
          <p className="text-sm leading-[22.75px] text-fg-muted">
            Ejecución algorítmica de órdenes, profundidad de mercado nivel 2 en tiempo real y custodia regulada en Caja
            de Valores S.A.
          </p>
        </div>
      </div>

      <div className="relative flex items-center justify-between pt-3">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {avatars.map((a) => (
              <span
                key={a.initials}
                className={`flex size-7 items-center justify-center rounded-full text-[11px] font-bold ring-2 ring-bg ${a.className}`}
              >
                {a.initials}
              </span>
            ))}
          </div>
          <div>
            <p className="font-mono text-xs font-semibold">+45.000 inversores activos</p>
            <p className="text-label text-fg-muted">Operando CEDEARs, Bonos Soberanos y Futuros</p>
          </div>
        </div>
        <Badge className="px-3 py-1">
          <Icon name="icon-shield-check" width={11} height={14} />
          Garantía BYMA / CNV
        </Badge>
      </div>
    </aside>
  );
}
