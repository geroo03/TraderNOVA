import type { Metadata } from "next";
import { OrdersHistory } from "@/components/trading/OrdersHistory";
import { PageHeader, Panel } from "@/components/ui/Page";
import { Badge, StatusDot } from "@/components/ui/Badge";

export const metadata: Metadata = { title: "Órdenes · Nodo Trading" };

// Pantalla sin diseño propio en el Figma: se arma con los componentes de la Boleta.
export default function OrdenesPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow={<Badge tone="positive" className="uppercase"><StatusDot /> Rueda en curso</Badge>}
        title="Órdenes"
        description="Seguimiento de tus órdenes enviadas al Sistema Integrado de Negociación de BYMA."
      />
      <Panel title="Libro de órdenes del día">
        <OrdersHistory />
      </Panel>
    </div>
  );
}
