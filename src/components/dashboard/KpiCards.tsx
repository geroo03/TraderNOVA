"use client";

import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Amount } from "@/components/ui/Amount";
import { Icon, type IconName } from "@/components/ui/Icon";
import { MoneyDialog, type MoneyAction } from "@/components/accounts/MoneyDialogs";
import { MEP, usePortfolio } from "@/components/portfolio/usePortfolio";
import { useTrading } from "@/components/trading/TradingProvider";
import { formatDecimal, formatInteger, formatPercent } from "@/lib/format";
import { portfolioSummary as s } from "@/lib/mock-data";
import { useSettingsStore } from "@/lib/store/hooks";
import { useState } from "react";

function KpiCard({ title, badge, children, footer }: { title: string; badge: ReactNode; children: ReactNode; footer: ReactNode }) {
  return (
    <Card className="relative flex flex-col justify-between overflow-hidden p-3">
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-label uppercase text-fg-subtle">{title}</h2>
          {badge}
        </div>
        {children}
      </div>
      <div className="pt-4">{footer}</div>
    </Card>
  );
}

function Sparkline({ name }: { name: IconName }) {
  return <Icon name={name} width={116} height={32} className="h-8 w-[116px]" />;
}

function FooterStat({ label, value, valueClass }: { label: string; value: string; valueClass: string }) {
  return (
    <div>
      <p className="text-label text-fg">{label}</p>
      <p className={`font-mono text-xs font-medium ${valueClass}`}>{value}</p>
    </div>
  );
}

/** KPIs del dashboard. Patrimonio, resultado y poder de compra se recalculan en vivo; respetan la moneda elegida en la barra superior. */
export function KpiCards() {
  const p = usePortfolio();
  const { account } = useTrading();
  const [settings] = useSettingsStore();
  const [dialog, setDialog] = useState<MoneyAction | null>(null);
  const usd = settings.currency === "USD";
  const conv = (ars: number) => (usd ? ars / MEP : ars);
  const cur = usd ? "USD" : "ARS";

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        title="Patrimonio total"
        badge={
          <Badge tone={p.dayResultPct >= 0 ? "positive" : "negative"}>
            <Icon name="kpi-trend-up" width={10} height={6} />
            {formatPercent(p.dayResultPct)} hoy
          </Badge>
        }
        footer={
          <div className="flex items-end justify-between">
            <div>
              <p className="text-label text-positive">{formatPercent(s.ytdPct)} YTD</p>
              <p className="text-label text-fg-subtle">vs Inflación 2025</p>
            </div>
            <Sparkline name="kpi-sparkline-1" />
          </div>
        }
      >
        <div aria-hidden className="absolute -top-6 -right-6 size-24 rounded-full bg-primary/10 blur-[12px]" />
        <Amount value={conv(p.total)} currency={cur} />
        <p className="flex items-center gap-1 text-xs text-fg-subtle">
          {usd ? "≈ ARS" : "≈ USD"} <span className="font-mono font-semibold text-fg">{formatDecimal(usd ? p.total : p.totalUsd)}</span>
          <span className="text-label">(MEP ref ${formatDecimal(MEP)})</span>
        </p>
      </KpiCard>

      <KpiCard
        title="Resultado del día"
        badge={
          <Badge tone={p.dayResult >= 0 ? "positive" : "negative"}>
            <Icon name="kpi-arrow-up" width={8} height={8} />
            {formatPercent(p.dayResultPct)}
          </Badge>
        }
        footer={
          <div className="flex items-end justify-between">
            <FooterStat label="Volumen operado" value={`$${formatInteger(s.dayVolume)}`} valueClass="text-fg-subtle" />
            <Sparkline name="kpi-sparkline-2" />
          </div>
        }
      >
        <Amount value={conv(p.dayResult)} currency={cur} signed className={p.dayResult >= 0 ? "text-positive" : "text-negative"} />
        <p className="text-xs text-fg-muted">Frente al cierre de ayer 17:00 hs · en vivo</p>
      </KpiCard>

      <KpiCard
        title="Rendimiento mensual"
        badge={
          <Badge tone="primary">
            <Icon name="kpi-mtd" width={11} height={9} />
            MTD
          </Badge>
        }
        footer={
          <div className="flex items-end justify-between">
            <FooterStat label="Alpha de Cartera" value={`+${formatDecimal(s.alphaPts)} pts`} valueClass="text-primary" />
            <Sparkline name="kpi-sparkline-3" />
          </div>
        }
      >
        <Amount value={conv(s.monthResult)} currency={cur} signed className="text-positive" />
        <p className="flex items-center gap-1 text-xs">
          <span className="font-semibold text-positive">{formatPercent(s.monthResultPct)}</span>
          <span className="text-fg-subtle">· Superando Merval en {formatPercent(s.monthVsMervalPct, 1)}</span>
        </p>
      </KpiCard>

      <KpiCard
        title="Poder de compra (T+0)"
        badge={<Badge>Inmediato</Badge>}
        footer={
          <div className="flex gap-1">
            <button type="button" onClick={() => setDialog("deposit")} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary-strong px-2 py-1.5 text-xs font-semibold text-on-primary hover:opacity-90">
              <Icon name="icon-plus-circle" width={13} height={13} />
              Ingresar
            </button>
            <button type="button" onClick={() => setDialog("mep")} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-surface-higher px-2 py-1.5 text-xs font-semibold hover:bg-surface-highest">
              <Icon name="icon-exchange" width={14} height={14} />
              Dólar MEP
            </button>
          </div>
        }
      >
        <Amount value={conv(account.availableArs)} currency={cur} />
        <p className="flex items-center gap-1 text-xs text-fg-subtle">
          Saldo USD: <span className="font-mono font-semibold text-positive">U$S {formatDecimal(account.availableUsd)}</span>
          <span className="text-label">MEP</span>
        </p>
      </KpiCard>
      {dialog && <MoneyDialog action={dialog} open onClose={() => setDialog(null)} />}
    </div>
  );
}
