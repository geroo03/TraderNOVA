import type { Metadata } from "next";
import { RiskView } from "@/components/admin/RiskView";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/Page";

export const metadata: Metadata = { title: "Límites & Riesgo" };

export default function Page() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow={<Badge className="uppercase">Control & Regulatorio</Badge>}
        title="Límites & Riesgo"
        description="Límites de exposición por comitente, aforos de caución, apalancamiento y parámetros globales. Cada cambio queda auditado."
      />
      <RiskView />
    </div>
  );
}
