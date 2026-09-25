import type { Metadata } from "next";
import { EquityCurve } from "@/components/portfolio/EquityCurve";
import { HoldingsTable } from "@/components/portfolio/HoldingsTable";
import { AllocationDonut, BalancesPanel, PortfolioHero } from "@/components/portfolio/PortfolioLive";
import { MoneyActionButton } from "@/components/accounts/MoneyDialogs";
import { FiscalReportButton } from "@/components/journal/FiscalReport";
import { StatusDot } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { MsIcon } from "@/components/ui/MsIcon";
import { PageHeader, Panel } from "@/components/ui/Page";
import type { MsIconName } from "@/components/ui/ms-icon-names";
import { currentUser } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Mi Tenencia · Nodo Trading" };

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
            <FiscalReportButton />
            <MoneyActionButton action="mep" icon="currency_exchange">
              Operar dólar MEP
            </MoneyActionButton>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <PortfolioHero />
        <BalancesPanel />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Panel title="Curva de crecimiento patrimonial" subtitle="Rendimiento relativo (base 100) frente a benchmarks">
          <EquityCurve />
        </Panel>
        <Panel title="Distribución de activos" subtitle="Composición por clase">
          <AllocationDonut />
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
