import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TerminalView } from "@/components/trading/TerminalView";
import { findInstrument, instruments } from "@/lib/market-data";

export function generateStaticParams() {
  return instruments.map((i) => ({ symbol: i.symbol }));
}

export async function generateMetadata({ params }: PageProps<"/terminal/[symbol]">): Promise<Metadata> {
  const { symbol } = await params;
  return { title: `Terminal ${symbol.toUpperCase()} · Nodo Trading` };
}

export default async function TerminalPage({ params }: PageProps<"/terminal/[symbol]">) {
  const { symbol } = await params;
  const instrument = findInstrument(symbol);
  if (!instrument) notFound();
  return <TerminalView symbol={instrument.symbol} />;
}
