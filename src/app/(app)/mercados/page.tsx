import type { Metadata } from "next";
import { MarketsView } from "@/components/markets/MarketsView";
import { Badge, StatusDot } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/Page";
import { Change } from "@/components/ui/Amount";
import { formatDecimal } from "@/lib/format";
import { marketIndices } from "@/lib/market-data";

export const metadata: Metadata = { title: "Mercados en vivo · Nodo Trading" };

export default function MercadosPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow={
          <Badge tone="positive" className="uppercase">
            <StatusDot /> Mercado abierto BYMA · Rueda 11:00 a 17:00 hs
          </Badge>
        }
        title="Mercados y Cotizaciones en Vivo"
        description="Conexión DMA directa a Caja de Valores & CNV."
        actions={
          <dl className="grid grid-cols-2 gap-x-6 gap-y-1 rounded-xl bg-surface p-3 font-mono text-xs">
            {marketIndices.map((m) => (
              <div key={m.label} className="flex items-center justify-between gap-3">
                <dt className="text-label uppercase text-fg-subtle">{m.label}</dt>
                <dd className="flex gap-2">
                  <span className="font-semibold">{formatDecimal(m.value).replace(/,00$/, "")}</span>
                  <Change value={m.changePct} fractionDigits={1} />
                </dd>
              </div>
            ))}
          </dl>
        }
      />
      <MarketsView />
    </div>
  );
}
