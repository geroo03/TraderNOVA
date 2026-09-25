import type { Metadata } from "next";
import { SupportDesk } from "@/components/admin/SupportDesk";
import { Badge, StatusDot } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/Page";

export const metadata: Metadata = { title: "Desk & Soporte" };

export default function Page() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow={<Badge tone="positive" className="uppercase"><StatusDot /> Mesa de ayuda en línea</Badge>}
        title="Desk & Soporte"
        description="Consultas de comitentes. Las que se crean desde el Centro de ayuda del inversor aparecen acá (en la misma pestaña o en otra)."
      />
      <SupportDesk />
    </div>
  );
}
