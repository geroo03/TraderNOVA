import type { Metadata } from "next";
import { ClientsHeader } from "@/components/admin/ClientsHeader";
import { ClientsView } from "@/components/admin/ClientsView";

export const metadata: Metadata = { title: "Usuarios & Cuentas" };

export default async function UsuariosPage({ searchParams }: PageProps<"/admin/usuarios">) {
  const q = (await searchParams).q;
  const initialQuery = (Array.isArray(q) ? q[0] : q) ?? "";
  return (
    <div className="flex flex-col gap-4">
      <ClientsHeader title="Gestión de Usuarios y Cuentas" />
      <ClientsView key={initialQuery} initialQuery={initialQuery} />
    </div>
  );
}
