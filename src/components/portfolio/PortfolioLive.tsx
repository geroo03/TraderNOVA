"use client";

import { Donut } from "@/components/charts/Donut";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Panel } from "@/components/ui/Page";
import { MoneyActionButton } from "@/components/accounts/MoneyDialogs";
import { useTrading } from "@/components/trading/TradingProvider";
import { formatDecimal, formatInteger, formatPercent } from "@/lib/format";
import { MEP, usePortfolio } from "./usePortfolio";
import { useInvestor } from "@/lib/store/hooks";

const signed = (v: number) => `${v >= 0 ? "+" : "-"}$${formatDecimal(Math.abs(v))}`;

/** Encabezado de Tenencia: valuación total y resultados, recalculados con cada tick. */
export function PortfolioHero() {
  const p = usePortfolio();
  const { simMode } = useTrading();
  return (
    <Card className="relative flex flex-col gap-4 overflow-hidden p-5">
      <div aria-hidden className="absolute -top-10 -right-10 size-48 rounded-full bg-primary/10 blur-3xl" />
      <div className="flex items-center justify-between">
        <span className="text-label uppercase text-fg-subtle">Valuación total de activos (ARS){simMode ? " · simulación" : ""}</span>
        <Badge tone="primary">MEP ref ${formatDecimal(MEP)}</Badge>
      </div>
      <p className="flex flex-wrap items-baseline gap-3">
        <span className="font-mono text-4xl font-bold tracking-[-1px]">${formatDecimal(p.total)}</span>
        <span className="font-mono text-sm text-fg-subtle">≈ USD {formatDecimal(p.totalUsd)}</span>
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg bg-surface-high p-3">
          <p className="text-label uppercase text-fg-subtle">Rendimiento histórico (posiciones)</p>
          <p className={`font-mono text-lg font-semibold ${p.historicGain >= 0 ? "text-positive" : "text-negative"}`}>{signed(p.historicGain)}</p>
          <p className="text-xs text-fg-subtle">{formatPercent(p.historicGainPct)} sobre el costo</p>
        </div>
        <div className="rounded-lg bg-surface-high p-3">
          <p className="text-label uppercase text-fg-subtle">Resultado diario (hoy BYMA)</p>
          <p className={`font-mono text-lg font-semibold ${p.dayResult >= 0 ? "text-positive" : "text-negative"}`}>{signed(p.dayResult)}</p>
          <p className="text-xs text-fg-subtle">{formatPercent(p.dayResultPct)} variación de tu cartera</p>
        </div>
      </div>
      <p className="text-label flex justify-between text-fg-subtle">
        <span>Custodiado bajo normativa CNV y Caja de Valores</span>
        <span>Valuación en vivo</span>
      </p>
    </Card>
  );
}

export function BalancesPanel() {
  const { account } = useTrading();
  return (
    <Panel title="Saldos disponibles para operar" actions={<Badge tone="positive">Liquidez inmediata (T+0)</Badge>}>
      <div className="flex flex-col gap-3">
        <div className="rounded-lg bg-surface-high p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-fg-muted">Pesos disponibles</span>
            <span className="font-mono text-lg font-semibold">${formatDecimal(account.availableArs)}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2">
            <MoneyActionButton action="deposit" size="sm" icon="add">
              Ingresar dinero
            </MoneyActionButton>
            <MoneyActionButton action="withdraw" size="sm" variant="secondary">
              Retirar
            </MoneyActionButton>
          </div>
        </div>
        <div className="rounded-lg bg-surface-high p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-fg-muted">Dólares disponibles (MEP/Cable)</span>
            <span className="font-mono text-lg font-semibold">U$S {formatDecimal(account.availableUsd)}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2">
            <MoneyActionButton action="mep" size="sm" variant="buy">
              Comprar MEP
            </MoneyActionButton>
            <MoneyActionButton action="withdraw" size="sm" variant="secondary">
              Transferir a banco
            </MoneyActionButton>
          </div>
        </div>
        <p className="flex justify-between text-xs">
          <span className="text-fg-subtle">Comprometido en órdenes de compra</span>
          <span className="font-mono">${formatDecimal(account.reservedArs)}</span>
        </p>
      </div>
    </Panel>
  );
}

export function AllocationDonut() {
  const { allocation, holdings } = usePortfolio();
  return (
    <div className="flex flex-col items-center gap-4">
      <Donut label="Distribución de la cartera por clase de activo" slices={allocation.map((a) => ({ value: a.amount, color: a.color }))} size={176}>
        <span className="text-label uppercase text-fg-subtle">Activos</span>
        <span className="text-2xl font-bold">{formatInteger(holdings.length)}</span>
        <span className="text-label uppercase text-positive">{holdings.length >= 5 ? "Diversificado" : "Concentrado"}</span>
      </Donut>
      <ul className="flex w-full flex-col gap-1">
        {allocation.map((a) => (
          <li key={a.label} className="flex items-center justify-between rounded-lg bg-surface-high/60 p-1.5 text-xs">
            <span className="flex items-center gap-2">
              <span className="size-2.5 rounded-full" style={{ background: a.color }} />
              {a.label}
            </span>
            <span className="font-mono">
              ${formatInteger(a.amount)} <span className="text-fg-subtle">{a.pct}%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export { ButtonLink };

export function AccountNumber() {
  return <>{useInvestor().accountNumber}</>;
}

/** Saludo de Tenencia según el resultado real de la cartera. */
export function PortfolioGreeting() {
  const { firstName } = useInvestor();
  const { holdings, historicGainPct } = usePortfolio();
  if (holdings.length === 0) return <>Todavía no tenés posiciones, {firstName}. Ingresá dinero y hacé tu primera operación para empezar a armar tu cartera.</>;
  return historicGainPct >= 0 ? (
    <>Tu cartera rinde {formatPercent(historicGainPct)} sobre lo invertido. ¡Buen trabajo, {firstName}!</>
  ) : (
    <>Tu cartera está {formatPercent(historicGainPct)} sobre lo invertido, {firstName}. Revisá la diversificación y tus stops.</>
  );
}
