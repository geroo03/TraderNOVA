import Link from "next/link";
import { Badge, StatusDot } from "@/components/ui/Badge";
import { Change } from "@/components/ui/Amount";
import { MsIcon } from "@/components/ui/MsIcon";
import { formatDecimal } from "@/lib/format";
import { dollarRates } from "@/lib/mock-data";
import { FooterNav, SidebarNav } from "./SidebarNav";
import { adminNav, userFooterNav, userNav } from "./nav-config";

export type ShellVariant = "user" | "admin";

export function Brand({ variant }: { variant: ShellVariant }) {
  return (
    <div className="flex h-16 items-center justify-between px-4">
      <Link href={variant === "admin" ? "/admin" : "/dashboard"} className="flex items-center gap-2">
        <span className="text-lg font-bold tracking-[-0.45px]">NODO</span>
        {variant === "admin" && (
          <Badge tone="primary" className="uppercase">
            Staff
          </Badge>
        )}
      </Link>
      <Badge tone="positive" pill className="bg-surface-high px-1.5 uppercase tracking-[0.25px]">
        <StatusDot /> {variant === "admin" ? "DMA Live" : "BYMA"}
      </Badge>
    </div>
  );
}

function DollarCard() {
  return (
    <section aria-label="Cotización dólar" className="flex flex-col gap-1 rounded-xl bg-surface p-2">
      <div className="flex items-center justify-between">
        <span className="text-label uppercase text-fg-subtle">Cotización dólar</span>
        <span className="text-label text-fg-subtle">CI / 24hs</span>
      </div>
      {dollarRates.map((rate) => (
        <div key={rate.label} className="flex items-center justify-between font-mono text-xs font-medium">
          <span className="text-fg-muted">{rate.label}</span>
          <span className="flex items-center gap-1">
            ${formatDecimal(rate.price)}
            <Change fractionDigits={1} value={rate.changePct} className="text-[11px]" />
          </span>
        </div>
      ))}
    </section>
  );
}

function SystemCard() {
  return (
    <section aria-label="Estado del sistema" className="flex items-center justify-between rounded-xl bg-surface p-2">
      <div>
        <p className="text-label flex items-center gap-1 uppercase text-positive">
          <StatusDot /> Sistema estable
        </p>
        <p className="text-label text-fg-subtle">SRV / CV: 100% OK</p>
      </div>
      <MsIcon name="dns" size={16} className="text-fg-subtle" />
    </section>
  );
}

/** Contenido del menú lateral; lo reutiliza el drawer móvil. */
export function SidebarContent({ variant, onNavigate }: { variant: ShellVariant; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col justify-between overflow-y-auto">
      <div>
        <Brand variant={variant} />
        <SidebarNav sections={variant === "admin" ? adminNav : userNav} onNavigate={onNavigate} />
      </div>
      <div className="flex flex-col gap-1 p-2 pt-6">
        {variant === "user" ? (
          <>
            <DollarCard />
            <div className="pt-1">
              <FooterNav items={userFooterNav} onNavigate={onNavigate} />
            </div>
          </>
        ) : (
          <SystemCard />
        )}
        <div className="flex items-center justify-between px-2 pt-1">
          <Link href={variant === "admin" ? "/dashboard" : "/admin"} onClick={onNavigate} className="text-label flex items-center gap-1 uppercase text-fg-subtle hover:text-fg">
            <MsIcon name="swap_horiz" size={14} />
            {variant === "admin" ? "Vista inversor" : "Vista staff"}
          </Link>
          <span className="text-label text-fg-subtle">v2.14 BYMA</span>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ variant }: { variant: ShellVariant }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 bg-surface-lowest lg:block">
      <SidebarContent variant={variant} />
    </aside>
  );
}
