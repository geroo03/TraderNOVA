import type { MsIconName } from "@/components/ui/ms-icon-names";

export interface NavItem {
  href: string;
  label: string;
  icon: MsIconName;
  badge?: string;
  badgeTone?: "positive" | "negative" | "primary";
  /** Prefijos extra que también marcan el ítem como activo. */
  alsoActive?: string[];
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const userNav: NavSection[] = [
  {
    title: "Plataforma",
    items: [
      { href: "/cotizaciones", label: "Cotizaciones", icon: "candlestick_chart" },
      { href: "/mercados", label: "Mercados en Vivo", icon: "monitoring" },
      { href: "/tenencia", label: "Mi Tenencia", icon: "pie_chart" },
      { href: "/operar", label: "Operar", icon: "bolt", badge: "BYMA", badgeTone: "positive", alsoActive: ["/terminal"] },
      { href: "/ordenes", label: "Órdenes", icon: "receipt_long" },
      { href: "/cuentas", label: "Cuentas y Fondos", icon: "account_balance" },
      { href: "/informes", label: "Diario e Informes", icon: "query_stats" },
    ],
  },
];

export const userFooterNav: NavItem[] = [
  { href: "/ajustes", label: "Ajustes", icon: "settings" },
  { href: "/soporte", label: "Soporte", icon: "support_agent", badge: "24/7", badgeTone: "positive" },
];

export const adminNav: NavSection[] = [
  {
    title: "Operaciones",
    items: [
      { href: "/admin", label: "Dashboard", icon: "space_dashboard" },
      { href: "/admin/usuarios", label: "Usuarios & Cuentas", icon: "group" },
      { href: "/admin/kyc", label: "KYC & Validación", icon: "badge", badge: "12", badgeTone: "negative" },
      { href: "/admin/ordenes", label: "Libro de Órdenes", icon: "menu_book", badge: "3", badgeTone: "primary" },
      { href: "/admin/tesoreria", label: "Tesorería & Fondos", icon: "account_balance_wallet" },
    ],
  },
  {
    title: "Control & Regulatorio",
    items: [
      { href: "/admin/riesgo", label: "Límites & Riesgo", icon: "shield" },
      { href: "/admin/cumplimiento", label: "Cumplimiento CNV/UIF", icon: "gavel" },
      { href: "/admin/soporte", label: "Desk & Soporte", icon: "headset_mic" },
    ],
  },
  {
    title: "Sistema",
    items: [{ href: "/admin/auditoria", label: "Auditoría & Roles", icon: "admin_panel_settings" }],
  },
];

export function isActive(pathname: string, item: NavItem): boolean {
  const prefixes = [item.href, ...(item.alsoActive ?? [])];
  return prefixes.some((p) =>
    // "/admin" solo coincide exacto; si no, marcaría todas las secciones del panel.
    p === "/admin" ? pathname === p : pathname === p || pathname.startsWith(`${p}/`),
  );
}
