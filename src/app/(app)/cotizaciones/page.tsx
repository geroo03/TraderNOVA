import type { Metadata } from "next";
import { QuotesView } from "@/components/markets/QuotesView";
import { PageHeader } from "@/components/ui/Page";
import { findInstrument } from "@/lib/market-data";

export const metadata: Metadata = { title: "Cotizaciones · Nodo Trading" };

const PANELS = ["fav", "Panel Líder", "CEDEAR", "Bono"] as const;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function CotizacionesPage({ searchParams }: PageProps<"/cotizaciones">) {
  const params = await searchParams;
  const panel = PANELS.find((p) => p === first(params.panel)) ?? "Panel Líder";
  const symbol = findInstrument(first(params.especie) ?? "")?.symbol ?? (panel === "Bono" ? "AL30D" : panel === "CEDEAR" ? "AAPL" : "GGAL");
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Cotizaciones y Terminal de Mercado" description="Precios de acciones, CEDEARs y bonos con libro de órdenes, alertas de precio y acceso rápido a operar." />
      <QuotesView key={`${panel}-${symbol}`} initialFilter={panel} initialSymbol={symbol} />
    </div>
  );
}
