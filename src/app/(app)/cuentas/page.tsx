import type { Metadata } from "next";
import { FundingNotice } from "@/components/accounts/FundingNotice";
import { AccountStats, HolderCard, LinkedAccountsList, MoneyActionButton, ThirdPartyWarning } from "@/components/accounts/AccountLive";
import { MovementsTable } from "@/components/accounts/MovementsTable";
import { Badge, StatusDot } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { CopyField } from "@/components/ui/CopyField";
import { MsIcon } from "@/components/ui/MsIcon";
import { PageHeader, Panel } from "@/components/ui/Page";
import { depositDetails as d } from "@/lib/accounts";

export const metadata: Metadata = { title: "Cuentas y Fondos · Nodo Trading" };

export default function CuentasPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow={
          <>
            <Badge className="uppercase">Billetera · Liquidación T+0</Badge>
            <Badge tone="positive" className="uppercase"><StatusDot /> Cobertura 24/7</Badge>
          </>
        }
        title="Cuentas y Fondos"
        description="Administrá tus transferencias, fondeo inmediato en pesos y dólares MEP, cuentas bancarias declaradas y trazabilidad fiscal CNV."
        actions={
          <HolderCard />
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AccountStats />
        <Card className="flex flex-col gap-1 bg-gradient-to-br from-primary-strong/25 to-surface p-3">
          <span className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-sm font-bold"><MsIcon name="bolt" size={16} className="text-primary" /> Fondeo Flash</span>
            <Badge tone="positive">24/7 activo</Badge>
          </span>
          <p className="text-xs text-fg-muted">Acreditación automática vía COELSA.</p>
          <p className="font-mono text-2xl font-bold">42 <span className="text-xs font-normal text-fg-subtle">segundos promedio</span></p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Panel title={<><MsIcon name="account_balance" size={18} className="text-primary" /> Datos para transferir a Nodo</>} subtitle="Conciliación automática e inmediata">
          <div className="flex flex-col gap-3">
            <p className="flex gap-2 rounded-lg bg-alert/10 p-3 text-xs text-negative">
              <MsIcon name="warning" size={16} className="mt-0.5" />
              <ThirdPartyWarning />
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <CopyField label="Banco receptor" value={d.bank} mono={false} />
              <CopyField label="Tipo de cuenta" value={d.accountType} mono={false} />
              <CopyField label="CBU receptora" value={d.cbu} />
              <CopyField label="Alias CBU" value={d.alias} />
            </div>
            <CopyField label={`Titular · CUIT ${d.cuit}`} value={d.holder} mono={false} />
          </div>
        </Panel>

        <Panel
          title="Cuentas vinculadas"
          actions={
            <MoneyActionButton action="link" size="sm" variant="ghost" icon="add">
              Vincular
            </MoneyActionButton>
          }
        >
          <LinkedAccountsList />
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Panel title="Aviso de fondeo rápido" subtitle="Avisanos que transferiste: en la demo se acredita a los pocos segundos">
          <FundingNotice />
        </Panel>
        <Panel title={<><MsIcon name="schedule" size={18} className="text-primary" /> Retiro programado express</>} actions={<Badge tone="positive">&lt; 10 min</Badge>}>
          <div className="flex flex-col gap-3 text-xs text-fg-muted">
            <p>Pedí retirar tus fondos hacia tus cuentas Galicia o BBVA en menos de 10 minutos en horario bancario. Fuera de horario se procesan a primera hora hábil.</p>
            <p className="flex justify-between rounded-lg bg-surface-high p-2 font-mono">
              <span>Costo por extracción</span>
              <span className="text-positive">$0,00</span>
            </p>
            <div className="flex flex-wrap gap-2">
              <MoneyActionButton action="withdraw" variant="secondary" icon="north_east">
                Ir a retirar fondos
              </MoneyActionButton>
              <MoneyActionButton action="mep" variant="ghost" icon="currency_exchange">
                Comprar dólar MEP
              </MoneyActionButton>
            </div>
          </div>
        </Panel>
      </div>

      <Panel title="Historial de movimientos y transferencias" subtitle="Depósitos, retiros, operaciones MEP y rentas de los últimos 30 días">
        <MovementsTable />
      </Panel>

      <p className="text-label text-fg-subtle">
        Operaciones custodiadas por Nodo Broker S.A., Agente de Liquidación y Compensación Propio (ALyC Nº 942). Demo: los movimientos se guardan en este navegador.
      </p>
    </div>
  );
}
