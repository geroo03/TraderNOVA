/** Aranceles de demo en puntos básicos (los del Figma). Con backend, vendrían del perfil comercial del cliente. */
const BPS = { commission: 15, marketRights: 8, vat: 2_100 } as const;

export const FEES = {
  commission: BPS.commission / 10_000,
  marketRights: BPS.marketRights / 10_000,
  vat: BPS.vat / 10_000,
} as const;

export type Side = "buy" | "sell";

export interface OrderCosts {
  gross: number;
  commission: number;
  marketRights: number;
  vat: number;
  /** Compra: lo que se debita. Venta: lo que se acredita. */
  total: number;
}

/**
 * Se calcula en centavos enteros y con tasas en puntos básicos: así evitamos errores
 * de punto flotante (p. ej. 5577,5 × 0,21 = 1171,2749999… que redondearía mal).
 */
const pct = (cents: number, bps: number) => Math.round((cents * bps) / 10_000);

/**
 * Desglose de una orden. El IVA aplica solo sobre aranceles (comisión + derechos),
 * no sobre el monto operado. En la venta los costos se descuentan del bruto.
 */
export function orderCosts(quantity: number, price: number, side: Side): OrderCosts {
  if (!Number.isFinite(quantity) || !Number.isFinite(price) || quantity <= 0 || price <= 0) {
    return { gross: 0, commission: 0, marketRights: 0, vat: 0, total: 0 };
  }
  const gross = Math.round(quantity * price * 100);
  const commission = pct(gross, BPS.commission);
  const marketRights = pct(gross, BPS.marketRights);
  const vat = pct(commission + marketRights, BPS.vat);
  const fees = commission + marketRights + vat;
  const total = side === "buy" ? gross + fees : gross - fees;
  return { gross: gross / 100, commission: commission / 100, marketRights: marketRights / 100, vat: vat / 100, total: total / 100 };
}

/** Máxima cantidad comprable con `available`, considerando aranceles. */
export function maxAffordable(available: number, price: number): number {
  if (price <= 0 || available <= 0) return 0;
  const feeFactor = 1 + (FEES.commission + FEES.marketRights) * (1 + FEES.vat);
  return Math.floor(available / (price * feeFactor));
}
