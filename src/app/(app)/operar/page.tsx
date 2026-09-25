import type { Metadata } from "next";
import { OperarView } from "@/components/trading/OperarView";
import { findInstrument } from "@/lib/market-data";

export const metadata: Metadata = { title: "Operar · Nodo Trading" };

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function OperarPage({ searchParams }: PageProps<"/operar">) {
  const params = await searchParams;
  // Se valida contra el universo conocido: un parámetro arbitrario cae en GGAL.
  const symbol = findInstrument(first(params.especie) ?? "")?.symbol ?? "GGAL";
  const side = first(params.lado) === "venta" ? "sell" : "buy";
  return <OperarView symbol={symbol} side={side} />;
}
