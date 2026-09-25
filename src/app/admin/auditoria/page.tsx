import type { Metadata } from "next";
import { AuditView } from "@/components/admin/AuditView";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/Page";

export const metadata: Metadata = { title: "Auditoría & Roles" };

export default function Page() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow={<Badge className="uppercase">Sistema</Badge>}
        title="Auditoría & Roles"
        description="Trazabilidad de cada acción del staff y matriz de permisos por rol."
      />
      <AuditView />
    </div>
  );
}
