import type { Metadata } from "next";
import { SupportView } from "@/components/support/SupportView";
import { Badge, StatusDot } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/Page";

export const metadata: Metadata = { title: "Soporte · Nodo Trading" };

export default function SoportePage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow={<Badge tone="positive" className="uppercase"><StatusDot /> Mesa de ayuda en línea</Badge>}
        title="Centro de ayuda"
        description="Preguntas frecuentes, asistente Nova y consultas con un asesor. Las consultas le llegan a la mesa de soporte de la vista staff."
      />
      <SupportView />
    </div>
  );
}
