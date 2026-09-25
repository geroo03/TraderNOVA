import type { Metadata } from "next";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const metadata: Metadata = { title: "Libro de Órdenes" };

export default function Page() {
  return (
    <ComingSoon
      icon="menu_book"
      title="Libro de Órdenes"
      description="Libro consolidado de órdenes DMA de todos los comitentes, con filtros por especie, estado y operador. Esta sección todavía no tiene diseño en el Figma."
      backHref="/admin"
      backLabel="Volver a la consola"
    />
  );
}
