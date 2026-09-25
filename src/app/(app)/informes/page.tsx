import type { Metadata } from "next";
import { JournalView } from "@/components/journal/JournalView";
import { Badge, StatusDot } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/Page";

export const metadata: Metadata = { title: "Diario de Trading · Nodo Trading" };

export default function InformesPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow={
          <>
            <Badge className="uppercase">Análisis & Journal</Badge>
            <Badge tone="positive" className="uppercase"><StatusDot /> DMA sync activo</Badge>
          </>
        }
        title="Diario de Trading"
        description="Registro diario de operaciones, P&L por rueda y bitácora asistida por Nova AI."
        actions={
          <ButtonLink href="/ordenes" variant="secondary" icon="sync">
            Ver órdenes sincronizadas
          </ButtonLink>
        }
      />
      <JournalView />
    </div>
  );
}
