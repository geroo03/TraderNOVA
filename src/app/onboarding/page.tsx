import type { Metadata } from "next";
import Link from "next/link";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { Badge } from "@/components/ui/Badge";
import { MsIcon } from "@/components/ui/MsIcon";

export const metadata: Metadata = { title: "Abrí tu cuenta · Nodo Trading" };

export default function OnboardingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="flex h-14 items-center justify-between gap-3 border-b border-surface-high bg-surface-lowest px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-bold">Nodo</span>
          <Badge className="uppercase">ALyC 942</Badge>
        </Link>
        <span className="text-label hidden items-center gap-1 text-fg-subtle md:flex">
          <MsIcon name="lock" size={12} /> Conexión segura SSL 256-bit · Regulado por CNV
        </span>
        <Link href="/login" className="text-xs text-fg-muted hover:text-fg">
          Ya tengo cuenta
        </Link>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6">
        <OnboardingFlow />
      </main>
      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-surface-high px-4 py-3 text-[11px] text-fg-subtle">
        <span>© 2025 Nodo Inversiones S.A. · Agente de Liquidación y Compensación Propio Nº 942 (demo)</span>
        <Badge>Prototipo · datos de ejemplo</Badge>
      </footer>
    </div>
  );
}
