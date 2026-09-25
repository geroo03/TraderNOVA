import type { Metadata } from "next";
import { QuotesView } from "@/components/markets/QuotesView";
import { PageHeader } from "@/components/ui/Page";

export const metadata: Metadata = { title: "Cotizaciones · Nodo Trading" };

export default function CotizacionesPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Cotizaciones y Terminal de Mercado" description="Precios de acciones, CEDEARs y bonos con libro de órdenes y acceso rápido a operar." />
      <QuotesView />
    </div>
  );
}
