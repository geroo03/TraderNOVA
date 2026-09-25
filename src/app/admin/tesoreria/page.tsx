import type { Metadata } from "next";
import { TreasuryView } from "@/components/admin/TreasuryView";
import { Badge, StatusDot } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageHeader, Stat } from "@/components/ui/Page";

export const metadata: Metadata = { title: "Tesorería & Fondos" };

export default function TesoreriaPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow={
          <>
            <Badge className="uppercase">Operaciones / Tesorería & Fondos</Badge>
            <Badge tone="positive" className="uppercase"><StatusDot /> COELSA DMA online (1ms)</Badge>
          </>
        }
        title="Gestión de Tesorería y Conciliación Bancaria"
        description="Supervisión de acreditaciones COELSA en tiempo real, validación de CUIT espejo (CNV/UIF), control de saldos para egresos T+0 y balance de custodia en Caja de Valores S.A."
        actions={
          <>
            <Button variant="secondary" icon="sync">Conciliación automática (batch)</Button>
            <Button icon="download">Exportar BCRA / CNV</Button>
          </>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Saldo cuentas recaudadoras" value={<span className="text-lg">$1.420.850.400,00</span>} badge={<Badge tone="positive">100% conciliado</Badge>} hint="U$S 3.840.200 MEP · Banco BIND + Galicia" />
        <Stat label="Cola pendiente de aprobación" value="14 operaciones" badge={<Badge tone="negative">Demora 4m 12s</Badge>} hint="$68.420.000 ARS · U$S 45.000 · 9 retiros, 5 observados" />
        <Stat label="Acreditaciones COELSA hoy" value={<span className="text-lg">$342.150.000</span>} badge={<Badge tone="primary">Rueda T+0</Badge>} hint="1.184 transferencias · 97,4% STP sin intervención" />
        <Stat label="Egresos programados" value={<span className="text-lg">$189.600.000</span>} badge={<Badge>T+1</Badge>} hint="142 retiros a cuentas propias (CUIT)" />
      </div>
      <TreasuryView />
    </div>
  );
}
