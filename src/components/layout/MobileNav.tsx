"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MsIcon } from "@/components/ui/MsIcon";
import { SidebarContent, type ShellVariant } from "./Sidebar";

/** Botón hamburguesa + drawer lateral para pantallas < lg. */
export function MobileNav({ variant }: { variant: ShellVariant }) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    // Evita que el fondo scrollee mientras el drawer está abierto.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menú"
        aria-expanded={open}
        className="rounded-lg p-1.5 text-fg-muted hover:bg-surface lg:hidden"
      >
        <MsIcon name="menu" size={20} />
      </button>
      {/* Portal a <body>: el header usa backdrop-filter, que convierte a sus hijos
          `fixed` en relativos al header y recortaría el drawer. */}
      {open && createPortal(
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menú principal">
          <button type="button" aria-label="Cerrar menú" tabIndex={-1} onClick={() => setOpen(false)} className="absolute inset-0 bg-black/60" />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-surface-lowest shadow-2xl">
            <div className="flex justify-end px-3 pt-3">
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar menú"
                className="rounded-lg p-1 text-fg-muted hover:bg-surface"
              >
                <MsIcon name="close" size={20} />
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <SidebarContent variant={variant} onNavigate={() => setOpen(false)} />
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
