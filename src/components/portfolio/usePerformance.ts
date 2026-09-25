"use client";

import { useMemo, useState } from "react";
import { useTrading } from "@/components/trading/TradingProvider";
import { performanceSeries, returnPct, seriesStats, type Range } from "@/lib/performance";
import { orderValue } from "@/lib/orders";
import { portfolioSummary } from "@/lib/mock-data";
import { SIM_START_ARS, SIM_START_USD } from "@/lib/store/demo-data";
import { useAccountStore } from "@/lib/store/hooks";
import { MEP, usePortfolio } from "./usePortfolio";

/**
 * Historia de rendimiento anclada al patrimonio del momento en que se abrió la pantalla
 * (para no redibujar todo con cada tick); el último punto sí es el patrimonio en vivo.
 */
function useAnchor() {
  const { total } = usePortfolio();
  const { simMode } = useTrading();
  const [anchor, setAnchor] = useState({ simMode, value: total });
  // Al cambiar de modo (real/simulación) se vuelve a anclar: son carteras distintas.
  if (anchor.simMode !== simMode) {
    const next = { simMode, value: total };
    setAnchor(next);
    return { anchor: next.value, total, simMode };
  }
  return { anchor: anchor.value, total, simMode };
}

/** Cuenta abierta desde el onboarding y operando en real: todavía no tiene historia de rendimiento. */
export function useFreshAccount() {
  const [account] = useAccountStore();
  const { simMode } = useTrading();
  return account.kind === "new" && !simMode;
}

export function usePerformance(range: Range) {
  const { anchor, total } = useAnchor();
  const base = useMemo(() => performanceSeries(range, anchor), [range, anchor]);
  const series = useMemo(() => ({ ...base, portfolio: [...base.portfolio.slice(0, -1), total] }), [base, total]);
  const stats = useMemo(() => seriesStats(series.portfolio, range), [series, range]);
  return { series, stats };
}

/** KPIs de rendimiento del dashboard: mes, YTD, alpha y volumen operado hoy. */
export function usePerformanceKpis() {
  const { anchor, total, simMode } = useAnchor();
  const { orders, movements } = useTrading();
  const fresh = useFreshAccount();

  return useMemo(() => {
    if (fresh) {
      // Resultado desde la apertura: patrimonio menos lo ingresado (neto de retiros).
      const contributed = movements.reduce((a, m) => {
        if (m.historic || m.status === "Rechazado") return a;
        if (m.kind === "deposit" && m.status === "En proceso") return a;
        if (m.kind !== "deposit" && m.kind !== "withdrawal") return a;
        return a + (m.currency === "USD" ? m.amount * MEP : m.amount);
      }, 0);
      const result = total - contributed;
      const pct = contributed > 0 ? (result / contributed) * 100 : 0;
      return { simMode, fresh, monthResult: result, monthPct: pct, vsMervalPct: 0, alphaPts: 0, ytdPct: pct, dayVolume: executedVolume(orders) };
    }
    const month = performanceSeries("1M", anchor);
    const ytd = performanceSeries("YTD", anchor);
    const monthStart = month.portfolio[0];
    // En simulación no hay historia: el resultado se mide contra el saldo virtual inicial.
    const simStart = SIM_START_ARS + SIM_START_USD * MEP;
    const start = simMode ? simStart : monthStart;
    const monthResult = total - start;
    const monthPct = (total / start - 1) * 100;
    const mervalPct = returnPct(month.merval);
    // Volumen de hoy: el de la semilla más lo que se ejecutó en esta sesión de la demo.
    const executed = executedVolume(orders);

    return {
      simMode,
      fresh,
      monthResult,
      monthPct,
      vsMervalPct: monthPct - mervalPct,
      alphaPts: monthPct - mervalPct,
      ytdPct: simMode ? monthPct : (total / ytd.portfolio[0] - 1) * 100,
      dayVolume: (simMode ? 0 : portfolioSummary.dayVolume) + executed,
    };
  }, [anchor, total, simMode, orders, movements, fresh]);
}

/** Volumen bruto (en pesos) de lo ejecutado en la demo, sin contar lo que ya estaba en la semilla. */
function executedVolume(orders: { filled: number; settledQty?: number; symbol: string; price: number; side: "buy" | "sell"; currency: "ARS" | "USD" }[]) {
  return orders.reduce((a, o) => {
    const qty = o.filled - (o.settledQty ?? 0);
    if (qty <= 0) return a;
    const gross = orderValue(o.symbol, qty, o.price, o.side).gross;
    return a + (o.currency === "USD" ? gross * MEP : gross);
  }, 0);
}
