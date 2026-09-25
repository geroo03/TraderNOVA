import type { Metadata } from "next";
import { ClientsHeader } from "@/components/admin/ClientsHeader";
import { ClientsView } from "@/components/admin/ClientsView";

export const metadata: Metadata = { title: "KYC & Validación" };

// Misma vista que Usuarios, arrancando filtrada en la cola de KYC pendientes.
export default async function KycPage({ searchParams }: PageProps<"/admin/kyc">) {
  const q = (await searchParams).q;
  const initialQuery = (Array.isArray(q) ? q[0] : q) ?? "";
  return (
    <div className="flex flex-col gap-4">
      <ClientsHeader title="KYC & Validación de Identidad" />
      <ClientsView key={initialQuery} initialFilter="kyc" initialQuery={initialQuery} />
    </div>
  );
}
