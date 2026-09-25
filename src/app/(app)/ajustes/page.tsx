import type { Metadata } from "next";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const metadata: Metadata = { title: "Ajustes · Nodo Trading" };

export default function AjustesPage() {
  return (
    <ComingSoon
      icon="settings"
      title="Ajustes de la cuenta"
      description="Preferencias de notificaciones, seguridad (2FA, dispositivos) y perfil de inversor. Esta sección todavía no tiene diseño."
      backHref="/dashboard"
      backLabel="Volver al dashboard"
    />
  );
}
