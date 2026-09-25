"use client";

import { useMemo } from "react";
import { useMarket } from "@/components/market/MarketProvider";
import { useTrading } from "@/components/trading/TradingProvider";
import { findInstrument } from "@/lib/market-data";
import { dollarRates } from "@/lib/mock-data";
import { valueHolding, type AssetClass, type Holding } from "@/lib/portfolio";

export const MEP = dollarRates.find((r) => r.label === "MEP")?.price ?? 1_285.4;

const CLASS: Record<string, AssetClass> = { "Panel Líder": "Acción", CEDEAR: "CEDEAR", Bono: "Bono" };

export interface AllocationItem {
  label: string;
  amount: number;
  pct: number;
  color: string;
}

/** Cartera valorizada en vivo: posiciones de la cuenta (real o simulada) × precios del feed. */
export function usePortfolio() {
  const { account } = useTrading();
  const { quote, prices } = useMarket();

  return useMemo(() => {
    const holdings: Holding[] = Object.entries(account.positions).map(([symbol, p]) => {
      const q = quote(symbol);
      const meta = findInstrument(symbol);
      const assetClass = CLASS[meta?.board ?? "Panel Líder"];
      return valueHolding({
        symbol,
        name: meta?.name ?? symbol,
        assetClass,
        tag: assetClass === "CEDEAR" ? `CEDEAR ${meta?.ratio ?? ""}`.trim() : assetClass === "Bono" ? (meta?.sector === "Corporativo" ? "ON Corporativa" : "Bono Soberano") : "BYMA Local",
        quantity: p.qty,
        avgPrice: p.avgPrice,
        lastPrice: q.price,
        dayChangePct: q.changePct,
        currency: q.currency,
      });
    });

    const toArs = (v: number, cur: "ARS" | "USD") => (cur === "USD" ? v * MEP : v);
    const invested = holdings.reduce((a, h) => a + toArs(h.valuation, h.currency), 0);
    const cost = holdings.reduce((a, h) => a + toArs(h.valuation - h.gain, h.currency), 0);
    const cash = account.ars + account.usd * MEP;
    const total = invested + cash;
    const dayResult = holdings.reduce((a, h) => a + toArs(h.valuation - h.valuation / (1 + h.dayChangePct / 100), h.currency), 0);

    const byClass = (c: AssetClass) => holdings.filter((h) => h.assetClass === c).reduce((a, h) => a + toArs(h.valuation, h.currency), 0);
    const raw = [
      { label: "CEDEARs USA", amount: byClass("CEDEAR"), color: "var(--color-primary-strong)" },
      { label: "Acciones BYMA", amount: byClass("Acción"), color: "var(--color-positive)" },
      { label: "Bonos & ONs Usd", amount: byClass("Bono"), color: "var(--color-primary)" },
      { label: "Liquidez ARS/USD", amount: cash, color: "var(--color-negative)" },
    ];
    const allocation: AllocationItem[] = raw.map((r) => ({ ...r, pct: total ? Math.round((r.amount / total) * 100) : 0 }));

    return {
      holdings,
      invested,
      cash,
      total,
      totalUsd: total / MEP,
      dayResult,
      dayResultPct: total - dayResult ? (dayResult / (total - dayResult)) * 100 : 0,
      historicGain: invested - cost,
      historicGainPct: cost ? ((invested - cost) / cost) * 100 : 0,
      allocation,
    };
    // `prices` cambia en cada tick; `quote` depende de él.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, prices]);
}
