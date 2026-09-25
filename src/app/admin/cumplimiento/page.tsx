import type { Metadata } from "next";
import { ComplianceView } from "@/components/admin/ComplianceView";
import { Badge, StatusDot } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageHeader, Stat } from "@/components/ui/Page";

export const metadata: Metadata = { title: "Cumplimiento CNV/UIF" };

export default function CumplimientoPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow={
          <>
            <Badge className="uppercase">Control & Regulatorio</Badge>
            <Badge tone="positive" className="uppercase"><StatusDot /> Monitoreo activo</Badge>
          </>
        }
        title="Matriz de Prevención de Lavado de Activos (PLA/FT)"
        description="Monitoreo transaccional automatizado, perfilamiento de riesgo por cliente, cumplimiento normativo y registro inmutable según Res. CNV y UIF."
        actions={
          <>
            <Button variant="secondary" icon="download">Exportar régimen CNV</Button>
            <Button variant="sell" icon="report">Generar reporte ROS / UIF</Button>
          </>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Alertas PLA/FT activas" value={<span className="text-negative">4</span>} badge={<Badge tone="negative">1 crítica pre-ROS</Badge>} hint="Requieren dictamen del oficial de cumplimiento" />
        <Stat label="Legajos PEP en revisión" value="18" badge={<Badge tone="primary">6 vencen este mes</Badge>} hint="Declaraciones juradas anuales" />
        <Stat label="Transacciones monitoreadas hoy" value="42.817" badge={<Badge>0,3% marcadas</Badge>} hint="Reglas R-01 a R-24 activas" />
        <Stat label="Score de cumplimiento CNV" value={<span className="text-positive">98,7%</span>} badge={<Badge tone="positive">Auditoría OK</Badge>} hint="Última revisión externa: octubre 2024" />
      </div>
      <ComplianceView />
    </div>
  );
}
