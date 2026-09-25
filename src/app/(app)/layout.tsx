import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

// TODO(auth): proteger estas rutas (proxy.ts o chequeo de sesión en el layout) cuando exista backend.
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 p-4">{children}</main>
        <footer className="flex flex-wrap items-center justify-between gap-4 bg-surface-lowest px-4 py-2">
          <p className="flex items-center gap-2">
            <span className="text-label uppercase text-fg-muted">Nodo Broker S.A.</span>
            <span className="text-xs text-fg-subtle">
              Agente de Liquidación y Compensación Propio (ALyC Nº 942 registrado ante CNV).
            </span>
          </p>
          <p className="text-label text-fg-subtle">
            Precios en tiempo real BYMA con diferimiento regulatorio. Prototipo de operaciones.
          </p>
        </footer>
      </div>
    </div>
  );
}
