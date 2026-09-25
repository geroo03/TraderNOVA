import { Badge, StatusDot } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageHeader, Stat } from "@/components/ui/Page";

export function ClientsHeader({ title }: { title: string }) {
  return (
    <>
      <PageHeader
        eyebrow={<Badge className="uppercase">Registro de agente Nº 942 · Compliance & Cuentas</Badge>}
        title={title}
        description="Auditoría de legajos KYC, verificación de identidad Renaper, scoring de riesgo y estados operativos de cuentas comitentes BYMA/MAE."
        actions={
          <>
            <Button variant="secondary" icon="download">Exportar padrón CNV (CSV)</Button>
            <Button icon="person_add">Alta manual de comitente</Button>
          </>
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total comitentes" value="18.420" badge={<Badge tone="positive">+162 hoy</Badge>} hint="Padrón sincronizado con CVSA 99,8%" />
        <Stat label="Activos operando" value="14.830" badge={<Badge tone="positive">88,5%</Badge>} hint="Con saldo o tenencia activa" />
        <Stat label="KYC pendientes" value={<span className="text-negative">12 casos</span>} badge={<Badge tone="negative">SLA 28m</Badge>} hint="Revisión manual nivel 3 · 3 críticos" />
        <Stat label="Bloqueados / observados" value="7" badge={<Badge tone="negative"><StatusDot tone="negative" /> UIF / PEP</Badge>} hint="Trabas judiciales y medidas cautelares" />
      </div>
    </>
  );
}
