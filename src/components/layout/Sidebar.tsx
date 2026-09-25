"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Badge, StatusDot } from "@/components/ui/Badge";
import { Change } from "@/components/ui/Amount";
import { formatDecimal } from "@/lib/format";
import { dollarRates } from "@/lib/mock-data";

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  iconSize: [number, number];
  badge?: string;
}

// Rutas planificadas según las pantallas del Figma; todavía no están implementadas.
const primaryNav: NavItem[] = [
  { href: "/cotizaciones", label: "Cotizaciones", icon: "nav-quotes", iconSize: [11, 12] },
  { href: "/tenencia", label: "Mi Tenencia", icon: "nav-holdings", iconSize: [15, 15] },
  { href: "/operar", label: "Operar", icon: "nav-trade", iconSize: [12, 15], badge: "BYMA" },
  { href: "/ordenes", label: "Órdenes", icon: "nav-orders", iconSize: [14, 15] },
  { href: "/cuentas", label: "Cuentas y Fondos", icon: "nav-accounts", iconSize: [15, 15] },
  { href: "/informes", label: "Análisis e Informes", icon: "nav-analytics", iconSize: [17, 13] },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col justify-between bg-surface-lowest lg:flex">
      <div>
        <div className="flex h-16 items-center justify-between px-4">
          <Link href="/dashboard" className="text-lg font-bold tracking-[-0.45px]">
            NODO
          </Link>
          <Badge tone="positive" pill className="bg-surface-high px-1 uppercase tracking-[0.25px]">
            <StatusDot /> BYMA
          </Badge>
        </div>
        <p className="text-label px-5 pt-5 pb-0.5 uppercase text-fg-subtle">Plataforma</p>
        <nav aria-label="Principal" className="flex flex-col gap-1 px-2 pt-2">
          {primaryNav.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-surface ${
                  active ? "bg-surface text-fg" : "text-fg-muted"
                }`}
              >
                <Icon name={item.icon} width={item.iconSize[0]} height={item.iconSize[1]} />
                {item.label}
                {item.badge && (
                  <Badge tone="positive" className="ml-auto bg-positive/10">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col gap-1 p-2">
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

        <nav aria-label="Cuenta" className="flex flex-col gap-1 pt-1">
          <Link href="/ajustes" className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-fg-muted hover:bg-surface">
            <Icon name="nav-settings" width={16} height={15} />
            Ajustes
          </Link>
          <Link href="/soporte" className="flex items-center justify-between rounded-lg px-3 py-2 text-xs text-fg-muted hover:bg-surface">
            <span className="flex items-center gap-2">
              <Icon name="nav-support" width={15} height={14} />
              Soporte
            </span>
            <span className="text-label text-positive">24/7</span>
          </Link>
        </nav>

        <div className="flex items-center justify-between px-2 pt-1">
          {/* TODO: implementar sidebar colapsable (el diseño solo muestra el estado expandido). */}
          <span className="text-label flex items-center gap-1 uppercase text-fg-subtle">
            <Icon name="nav-collapse" width={14} height={14} />
            Minimizar
          </span>
          <span className="text-label text-fg-subtle">v2.14 BYMA</span>
        </div>
      </div>
    </aside>
  );
}
