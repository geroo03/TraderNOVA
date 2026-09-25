"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { MsIcon } from "@/components/ui/MsIcon";
import { usePopover } from "@/components/ui/usePopover";
import { useToast } from "@/components/ui/Toast";
import type { MsIconName } from "@/components/ui/ms-icon-names";
import { currentUser, staffUser } from "@/lib/mock-data";
import { useSettingsStore } from "@/lib/store/hooks";
import type { ShellVariant } from "./Sidebar";

/** Botón de tema claro/oscuro. */
export function ThemeToggle() {
  const [settings, setSettings] = useSettingsStore();
  const light = settings.theme === "light";
  return (
    <button
      type="button"
      aria-label={light ? "Cambiar a tema oscuro" : "Cambiar a tema claro"}
      onClick={() => setSettings((s) => ({ ...s, theme: light ? "dark" : "light" }))}
      className="hidden rounded-lg p-1.5 text-fg-muted hover:bg-surface sm:block"
    >
      {light ? <MsIcon name="dark_mode" size={16} /> : <Icon name="icon-moon" width={15} height={15} />}
    </button>
  );
}

/** Avatar con menú de cuenta: perfil, cambio de vista y cierre de sesión. */
export function UserMenu({ variant }: { variant: ShellVariant }) {
  const router = useRouter();
  const toast = useToast();
  const { open, setOpen, ref } = usePopover();
  const [settings] = useSettingsStore();
  const admin = variant === "admin";
  const name = admin ? staffUser.fullName : settings.profile.fullName;

  const links: { href: string; label: string; icon: MsIconName }[] = admin
    ? [
        { href: "/admin/auditoria", label: "Roles y auditoría", icon: "admin_panel_settings" },
        { href: "/dashboard", label: "Ir a vista inversor", icon: "swap_horiz" },
      ]
    : [
        { href: "/ajustes", label: "Mi perfil y ajustes", icon: "settings" },
        { href: "/soporte", label: "Centro de ayuda", icon: "support_agent" },
        { href: "/admin", label: "Ir a vista staff", icon: "swap_horiz" },
      ];

  return (
    <div ref={ref} className="relative">
      <button type="button" aria-expanded={open} aria-label="Menú de cuenta" onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-lg p-0.5 pl-1 hover:bg-surface">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-on-primary">
          {admin ? staffUser.initials : name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
        </span>
        <span className="hidden text-left md:block">
          <span className="flex items-center gap-1 text-xs font-semibold">
            {name}
            {!admin && currentUser.verified && <Icon name="icon-verified" width={13} height={13} label="Cuenta verificada" />}
          </span>
          <span className="text-label block text-fg-subtle">{admin ? staffUser.role : "Verificada CNV"}</span>
        </span>
      </button>
      {open && (
        <div className="absolute top-full right-0 z-30 mt-2 w-60 overflow-hidden rounded-xl border border-surface-highest bg-surface-higher p-1 shadow-2xl">
          <p className="px-2 py-1.5 text-[11px] text-fg-subtle">{admin ? "Nodo Broker S.A. · Staff" : `Comitente ${currentUser.accountNumber}`}</p>
          {links.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-surface-highest">
              <MsIcon name={l.icon} size={16} className="text-fg-subtle" />
              {l.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              toast({ title: "Sesión cerrada", text: "Tus datos de la demo quedan guardados en este navegador.", tone: "neutral" });
              router.push("/login");
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-negative hover:bg-surface-highest"
          >
            <MsIcon name="logout" size={16} />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
