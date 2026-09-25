import type { Metadata } from "next";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const metadata: Metadata = { title: "Límites & Riesgo" };

export default function Page() {
  return (
    <ComingSoon
      icon="shield"
      title="Límites & Riesgo"
      description="Configuración de límites de exposición, márgenes de caución y alertas de riesgo por comitente. Esta sección todavía no tiene diseño en el Figma."
      backHref="/admin"
      backLabel="Volver a la consola"
    />
  );
}
