import type { Metadata } from "next";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const metadata: Metadata = { title: "Auditoría & Roles" };

export default function Page() {
  return (
    <ComingSoon
      icon="admin_panel_settings"
      title="Auditoría & Roles"
      description="Gestión de usuarios staff, permisos por rol y revisión del log de auditoría. Esta sección todavía no tiene diseño en el Figma."
      backHref="/admin"
      backLabel="Volver a la consola"
    />
  );
}
