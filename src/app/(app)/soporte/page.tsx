import type { Metadata } from "next";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const metadata: Metadata = { title: "Soporte · Nodo Trading" };

export default function SoportePage() {
  return (
    <ComingSoon
      icon="support_agent"
      title="Soporte 24/7"
      description="Chat con la mesa de operaciones, preguntas frecuentes y seguimiento de reclamos. Esta sección todavía no tiene diseño."
      backHref="/dashboard"
      backLabel="Volver al dashboard"
    />
  );
}
