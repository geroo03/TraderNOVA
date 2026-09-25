import type { Metadata } from "next";
import { ClientsHeader } from "@/components/admin/ClientsHeader";
import { ClientsView } from "@/components/admin/ClientsView";

export const metadata: Metadata = { title: "Usuarios & Cuentas" };

export default function UsuariosPage() {
  return (
    <div className="flex flex-col gap-4">
      <ClientsHeader title="Gestión de Usuarios y Cuentas" />
      <ClientsView />
    </div>
  );
}
