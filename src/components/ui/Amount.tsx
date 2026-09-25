import { formatPercent, splitAmount, trendOf } from "@/lib/format";

interface AmountProps {
  value: number;
  currency?: string;
  /** Muestra "+" en valores positivos (resultados, no saldos). */
  signed?: boolean;
  className?: string;
}

/** Monto grande de KPI: "$24.850.340" + ",00" más chico + moneda. */
export function Amount({ value, currency = "ARS", signed = false, className = "" }: AmountProps) {
  const { integer, decimals } = splitAmount(value);
  const sign = value < 0 ? "-" : signed && value > 0 ? "+" : "";

  return (
    <p className={`flex items-baseline gap-1 whitespace-nowrap ${className}`}>
      <span className="font-mono text-xl font-semibold tracking-[-0.5px]">
        {sign}${integer}
        <span className="text-sm font-medium tracking-normal opacity-80">{decimals}</span>
      </span>
      <span className="text-label text-fg-subtle">{currency}</span>
    </p>
  );
}

const trendClasses = { up: "text-positive", down: "text-negative", flat: "text-fg-muted" } as const;

/** Variación porcentual coloreada según el signo. */
export function Change({ value, fractionDigits = 2, className = "" }: { value: number; fractionDigits?: number; className?: string }) {
  return <span className={`${trendClasses[trendOf(value)]} ${className}`}>{formatPercent(value, fractionDigits)}</span>;
}
