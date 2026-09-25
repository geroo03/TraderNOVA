import type { ReactNode } from "react";
import { Sidebar, type ShellVariant } from "./Sidebar";
import { Topbar } from "./Topbar";
import { StatusBanners } from "./StatusBanners";

const footerCopy: Record<ShellVariant, [string, string]> = {
  user: [
    "Agente de Liquidación y Compensación Propio (ALyC Nº 942 registrado ante CNV).",
    "Precios en tiempo real BYMA con diferimiento regulatorio. Prototipo de operaciones.",
  ],
  admin: [
    "Nodo Trading S.A. · Agente de Liquidación y Compensación Propio Nº 942 · Acceso restringido a personal autorizado.",
    "Todas las acciones quedan registradas en el log de auditoría (demo).",
  ],
};

// TODO(auth): proteger estas rutas (proxy.ts o chequeo de sesión) cuando exista backend.
export function AppShell({ variant, children }: { variant: ShellVariant; children: ReactNode }) {
  const [left, right] = footerCopy[variant];
  return (
    <div className="flex min-h-screen">
      <Sidebar variant={variant} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar variant={variant} />
        {variant === "user" && <StatusBanners />}
        <main className="flex-1 p-4">{children}</main>
        <footer className="flex flex-wrap items-center justify-between gap-4 bg-surface-lowest px-4 py-2">
          <p className="flex items-center gap-2">
            <span className="text-label uppercase text-fg-muted">Nodo Broker S.A.</span>
            <span className="text-xs text-fg-subtle">{left}</span>
          </p>
          <p className="text-label text-fg-subtle">{right}</p>
        </footer>
      </div>
    </div>
  );
}
