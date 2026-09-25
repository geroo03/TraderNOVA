const LOCALE = "es-AR";

const decimalFormatter = new Intl.NumberFormat(LOCALE, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const integerFormatter = new Intl.NumberFormat(LOCALE, {
  maximumFractionDigits: 0,
});

/** 24850340 -> "24.850.340,00" */
export function formatDecimal(value: number): string {
  return decimalFormatter.format(value);
}

/** 24850340 -> "24.850.340" */
export function formatInteger(value: number): string {
  return integerFormatter.format(value);
}

/** 2.14 -> "+2,14%" (sign always shown so gains and losses read at a glance). */
export function formatPercent(value: number, fractionDigits = 2): string {
  const formatted = new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
    signDisplay: "exceptZero",
  }).format(value);
  return `${formatted}%`;
}

/**
 * Splits an amount into its integer and decimal parts so the UI can render
 * the cents smaller, as the design does ("$24.850.340" + ",00").
 */
export function splitAmount(value: number): { integer: string; decimals: string } {
  const [integer, decimals = "00"] = formatDecimal(Math.abs(value)).split(",");
  return { integer, decimals: `,${decimals}` };
}

export type Trend = "up" | "down" | "flat";

export function trendOf(value: number): Trend {
  if (value > 0) return "up";
  if (value < 0) return "down";
  return "flat";
}
