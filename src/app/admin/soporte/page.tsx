import type { Metadata } from "next";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const metadata: Metadata = { title: "Desk & Soporte" };

export default function Page() {
  return (
    <ComingSoon
      icon="headset_mic"
      title="Desk & Soporte"
      description="Tickets de comitentes, chat con la mesa y escalamiento a operaciones. Esta sección todavía no tiene diseño en el Figma."
      backHref="/admin"
      backLabel="Volver a la consola"
    />
  );
}
