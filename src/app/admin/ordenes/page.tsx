import type { Metadata } from "next";
import { AdminOrdersView } from "@/components/admin/AdminOrdersView";
import { Badge, StatusDot } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/Page";

export const metadata: Metadata = { title: "Libro de Órdenes" };

export default function Page() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow={
          <>
            <Badge className="uppercase">Operaciones</Badge>
            <Badge tone="positive" className="uppercase"><StatusDot /> DMA BYMA en rueda</Badge>
          </>
        }
        title="Libro de Órdenes"
        description="Órdenes de todos los comitentes enviadas por web, app, API y mesa. Filtrá, auditá rechazos y cancelá órdenes abiertas."
      />
      <AdminOrdersView />
    </div>
  );
}
