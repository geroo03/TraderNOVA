import type { Metadata } from "next";
import { SettingsView } from "@/components/settings/SettingsView";
import { PageHeader } from "@/components/ui/Page";

export const metadata: Metadata = { title: "Ajustes · Nodo Trading" };

export default function AjustesPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Ajustes de la cuenta" description="Perfil, seguridad, notificaciones, preferencias y perfil de inversor." />
      <SettingsView />
    </div>
  );
}
