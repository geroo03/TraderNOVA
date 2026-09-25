import type { Metadata } from "next";
import { Donut } from "@/components/charts/Donut";
import { EquityCurve } from "@/components/portfolio/EquityCurve";
import { HoldingsTable } from "@/components/portfolio/HoldingsTable";
import { Badge, StatusDot } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MsIcon } from "@/components/ui/MsIcon";
import { PageHeader, Panel } from "@/components/ui/Page";
import type { MsIconName } from "@/components/ui/ms-icon-names";
import { formatDecimal, formatInteger, formatPercent } from "@/lib/format";
import { allocation, currentUser, portfolioSummary as s } from "@/lib/mock-data";
import { accountBalances as b } from "@/lib/portfolio";

export const metadata: Metadata = { title: "Mi Tenencia · Nodo Trading" };

const SLICE_COLORS = ["var(--color-primary-strong)", "var(--color-positive)", "var(--color-primary)", "var(--color-negative)"];

const infoCards: { icon: MsIconName; title: string; text: string; tone: string }[] = [
  { icon: "monitoring", title: "Volatilidad controlada", text: "Tu cartera presenta un beta de 0,84 frente al Merval, lo que la protege de oscilaciones cambiarias abruptas.", tone: "text-primary" },
  { icon: "paid", title: "Cobertura dólar (66%)", text: "La mayor parte de tu capital está atada a cotización CCL a través de CEDEARs y bonos hard dollar.", tone: "text-positive" },
  { icon: "verified_user", title: "Custodia garantizada", text: "Tus activos están depositados en Caja de Valores S.A. bajo tu CUIT, fuera del balance del broker.", tone: "text-primary" },
];

export default function TenenciaPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-positive/10 px-4 py-2 text-xs">
        <span className="flex items-center gap-2 text-positive">
          <MsIcon name="celebration" size={16} />
          <span>
            <strong>Acreditación de dividendos:</strong> cobraste dividendos de AAPL por U$S 18,50 en tu cuenta en dólares.
          </span>
        </span>
        <span className="text-label text-fg-subtle">Custodia: Caja de Valores S.A.</span>
      </div>

      <PageHeader
        eyebrow={
          <span className="text-label flex items-center gap-1 uppercase text-fg-subtle">
            Cuenta comitente Nº {currentUser.accountNumber} · <StatusDot /> Actualizado en vivo BYMA
          </span>
        }
        title="Mi Tenencia Valorizada"
        description={`Tu cartera rindió más que el índice Merval durante el último mes. ¡Excelente rendimiento, ${currentUser.fullName.split(" ")[0]}!`}
        actions={
          <>
            <ButtonLink href="/informes" variant="secondary" icon="description">
              Informe fiscal AFIP
            </ButtonLink>
            <ButtonLink href="/operar?especie=AL30D" icon="currency_exchange">
              Operar dólar MEP
            </ButtonLink>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Card className="relative flex flex-col gap-4 overflow-hidden p-5">
          <div aria-hidden className="absolute -top-10 -right-10 size-48 rounded-full bg-primary/10 blur-3xl" />
          <div className="flex items-center justify-between">
            <span className="text-label uppercase text-fg-subtle">Valuación total de activos (ARS)</span>
            <Badge tone="primary">MEP ref ${formatDecimal(s.mepReference)}</Badge>
          </div>
          <p className="flex flex-wrap items-baseline gap-3">
            <span className="font-mono text-4xl font-bold tracking-[-1px]">${formatDecimal(s.totalEquity)}</span>
            <span className="font-mono text-sm text-fg-subtle">≈ USD {formatDecimal(s.totalEquityUsd)}</span>
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-surface-high p-3">
              <p className="text-label uppercase text-fg-subtle">Rendimiento histórico total</p>
              <p className="font-mono text-lg font-semibold text-positive">+${formatDecimal(b.historicGain)}</p>
              <p className="text-xs text-fg-subtle">{formatPercent(b.historicGainPct)} desde la apertura</p>
            </div>
            <div className="rounded-lg bg-surface-high p-3">
              <p className="text-label uppercase text-fg-subtle">Resultado diario (hoy BYMA)</p>
              <p className="font-mono text-lg font-semibold text-positive">+${formatDecimal(s.dayResult)}</p>
              <p className="text-xs text-fg-subtle">{formatPercent(s.dayResultPct)} variación de tu cartera</p>
            </div>
          </div>
          <p className="text-label flex justify-between text-fg-subtle">
            <span>Custodiado bajo normativa CNV y Caja de Valores</span>
            <span>Último corte: 16:59 hs</span>
          </p>
        </Card>

        <Panel title="Saldos disponibles para operar" actions={<Badge tone="positive">Liquidez inmediata (T+0)</Badge>}>
          <div className="flex flex-col gap-3">
            <div className="rounded-lg bg-surface-high p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-fg-muted">Pesos disponibles</span>
                <span className="font-mono text-lg font-semibold">${formatDecimal(b.arsAvailable)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <ButtonLink href="/cuentas" size="sm" icon="add">
                  Ingresar dinero
                </ButtonLink>
                <ButtonLink href="/cuentas" size="sm" variant="secondary">
                  Retirar
                </ButtonLink>
              </div>
            </div>
            <div className="rounded-lg bg-surface-high p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-fg-muted">Dólares disponibles (MEP/Cable)</span>
                <span className="font-mono text-lg font-semibold">U$S {formatDecimal(b.usdAvailable)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <ButtonLink href="/operar?especie=AL30D" size="sm" variant="buy">
                  Comprar MEP
                </ButtonLink>
                <ButtonLink href="/cuentas" size="sm" variant="secondary">
                  Transferir a banco
                </ButtonLink>
              </div>
            </div>
            <p className="flex justify-between text-xs">
              <span className="text-fg-subtle">Comprometido en órdenes de compra</span>
              <span className="font-mono">${formatDecimal(b.committed)}</span>
            </p>
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Panel title="Curva de crecimiento patrimonial" subtitle="Rendimiento relativo (base 100) frente a benchmarks">
          <EquityCurve />
        </Panel>
        <Panel title="Distribución de activos" subtitle="Composición por clase">
          <div className="flex flex-col items-center gap-4">
            <Donut label="Distribución de la cartera por clase de activo" slices={allocation.map((a, i) => ({ value: a.pct, color: SLICE_COLORS[i] }))} size={176}>
              <span className="text-label uppercase text-fg-subtle">Activos</span>
              <span className="text-2xl font-bold">{formatInteger(8)}</span>
              <span className="text-label uppercase text-positive">Diversificado</span>
            </Donut>
            <ul className="flex w-full flex-col gap-1">
              {allocation.map((a, i) => (
                <li key={a.label} className="flex items-center justify-between rounded-lg bg-surface-high/60 p-1.5 text-xs">
                  <span className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full" style={{ background: SLICE_COLORS[i] }} />
                    {a.label}
                  </span>
                  <span className="font-mono">
                    ${formatInteger(a.amount)} <span className="text-fg-subtle">{a.pct}%</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Panel>
      </div>

      <Panel title="Tenencia actual de activos" subtitle="Detalle de cartera">
        <HoldingsTable />
      </Panel>

      <div className="grid gap-3 md:grid-cols-3">
        {infoCards.map((c) => (
          <Card key={c.title} className="flex gap-3 p-4">
            <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-high ${c.tone}`}>
              <MsIcon name={c.icon} size={20} />
            </span>
            <div>
              <p className="text-sm font-semibold">{c.title}</p>
              <p className="text-xs text-fg-subtle">{c.text}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
