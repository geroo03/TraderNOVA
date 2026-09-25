import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";
import { MarketShowcase } from "@/components/auth/MarketShowcase";
import { Icon } from "@/components/ui/Icon";
import { Badge, StatusDot } from "@/components/ui/Badge";

export const metadata: Metadata = { title: "Iniciar sesión · Nodo Trading" };

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="fixed inset-x-0 top-0 z-10 flex h-14 items-center justify-between bg-surface-lowest/80 px-6 backdrop-blur-[6px]">
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold tracking-[-0.45px]">Nodo</span>
          <span aria-hidden className="h-4 w-px bg-outline" />
          <Badge className="uppercase">BYMA &amp; CEDEARs</Badge>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-label flex items-center gap-1 uppercase text-fg-muted">
            <StatusDot size={8} /> DMA Direct Feed
          </span>
          <span className="flex size-8 items-center justify-center rounded-full bg-primary">
            <Icon name="icon-user" width={12} height={12} />
          </span>
        </div>
      </header>

      <main className="flex flex-1 pt-14 pb-[22px]">
        <div className="flex min-h-[890px] w-full">
          <section className="flex flex-1 flex-col justify-between bg-surface-lowest p-6 sm:p-12">
            <div className="flex items-center justify-between gap-4 pb-4">
              <div className="flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-lg bg-surface-higher shadow-card">
                  <Icon name="login-logo-mark" width={20} height={20} />
                </span>
                <span className="text-lg font-semibold tracking-[-0.45px]">NODO</span>
                <Badge tone="primary" className="bg-surface-highest">BYMA</Badge>
              </div>
              <span className="text-label hidden items-center gap-1 rounded-full bg-surface px-2 py-1 uppercase text-fg-muted sm:flex">
                <StatusDot /> TLS 1.3 · ALYC Nº 942 CNV
              </span>
            </div>

            <div className="flex flex-1 items-center justify-center py-12 lg:px-12">
              <LoginForm />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3">
              <span className="text-label flex items-center gap-1 uppercase text-fg-muted">
                <Icon name="icon-legal" width={11} height={12} />
                Ley 25.326 Protección de datos · CNV Res. 823
              </span>
              <span className="text-label text-outline">BUILD 2025.4.19-FIX</span>
            </div>
          </section>

          <MarketShowcase />
        </div>
      </main>

      <footer className="flex flex-wrap items-center justify-between gap-2 bg-surface-lowest px-6 py-2">
        <p className="text-label flex flex-wrap items-center gap-3 uppercase text-fg-muted">
          <span>Regulado por CNV (ALyC propio)</span>
          <span aria-hidden className="text-outline">•</span>
          <span>Conexión BYMA DMA FIX 4.4</span>
          <span aria-hidden className="text-outline">•</span>
          <span>Encriptación 256-bit TLS</span>
        </p>
        <Badge tone="positive" className="bg-surface-higher">
          <Icon name="icon-shield-footer" width={10} height={12} />
          Prototipo - datos de ejemplo
        </Badge>
      </footer>
    </div>
  );
}
