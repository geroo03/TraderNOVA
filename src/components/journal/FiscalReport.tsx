"use client";

import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { usePortfolio, MEP } from "@/components/portfolio/usePortfolio";
import { useTrading } from "@/components/trading/TradingProvider";
import { downloadFile, stamp, toCsv } from "@/lib/download";
import { useInvestor } from "@/lib/store/hooks";

/** Resumen para la declaración de Bienes Personales / Ganancias con la tenencia y los movimientos actuales. */
export function FiscalReportButton() {
  const toast = useToast();
  const { holdings, total } = usePortfolio();
  const { movements, orders } = useTrading();
  const investor = useInvestor();

  function download() {
    const lines = [
      `Informe fiscal (demo) · Comitente ${investor.accountNumber} · ${investor.fullName} · CUIT ${investor.cuit}`,
      `Valuación total ARS,${total.toFixed(2)}`,
      `Tipo de cambio MEP de referencia,${MEP}`,
      "",
      toCsv(
        ["especie", "clase", "cantidad", "ppc", "cotizacion", "valuacion", "resultado_no_realizado", "moneda"],
        holdings.map((h) => [h.symbol, h.assetClass, h.quantity, h.avgPrice.toFixed(2), h.lastPrice, h.valuation.toFixed(2), h.gain.toFixed(2), h.currency]),
      ),
      "",
      toCsv(["fecha", "movimiento", "monto", "moneda", "estado"], movements.map((m) => [m.date, m.title, m.amount, m.currency, m.status])),
      "",
      toCsv(["orden", "especie", "operacion", "ejecutada", "precio", "moneda"], orders.filter((o) => o.filled > 0).map((o) => [o.id, o.symbol, o.side, o.filled, o.price, o.currency])),
    ];
    downloadFile(`informe-fiscal-nodo_${stamp()}.csv`, lines.join("\n"));
    toast({ title: "Informe fiscal descargado", text: "Tenencia valorizada, movimientos y operaciones." });
  }

  return (
    <Button variant="secondary" icon="description" onClick={download}>
      Informe fiscal AFIP
    </Button>
  );
}
