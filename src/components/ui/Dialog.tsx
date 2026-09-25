"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { MsIcon } from "./MsIcon";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}

const widths = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" } as const;

/** Ventana modal sobre <dialog> nativo: foco atrapado, Escape y fondo inerte sin librerías. */
export function Dialog({ open, onClose, title, description, children, footer, size = "md" }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        // Clic en el fondo (fuera del contenido) cierra.
        if (e.target === e.currentTarget) onClose();
      }}
      className={`m-auto w-[calc(100vw-2rem)] ${widths[size]} rounded-2xl bg-surface p-0 text-fg shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-[2px]`}
    >
      {open && (
        <div className="flex max-h-[85vh] flex-col">
          <div className="flex items-start justify-between gap-3 border-b border-surface-higher p-4">
            <div>
              <h2 className="text-base font-bold">{title}</h2>
              {description && <p className="pt-0.5 text-xs text-fg-subtle">{description}</p>}
            </div>
            <button type="button" aria-label="Cerrar" onClick={onClose} className="rounded-md p-1 text-fg-subtle hover:bg-surface-high hover:text-fg">
              <MsIcon name="close" size={18} />
            </button>
          </div>
          <div className="overflow-y-auto p-4">{children}</div>
          {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-surface-higher p-4">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}

export const fieldCls =
  "w-full rounded-lg bg-surface-high px-3 py-2 text-sm text-fg outline-none placeholder:text-fg-subtle focus-visible:ring-2 focus-visible:ring-primary";

export function Field({ label, hint, error, children }: { label: string; hint?: ReactNode; error?: string | null; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-label uppercase text-fg-subtle">{label}</span>
      {children}
      {error ? <span className="text-xs text-negative">{error}</span> : hint && <span className="text-[11px] text-fg-subtle">{hint}</span>}
    </label>
  );
}

/** Interruptor accesible (role=switch) reutilizado en ajustes y paneles staff. */
export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? "bg-primary-strong" : "bg-surface-highest"}`}
    >
      <span className={`absolute top-0.5 size-4 rounded-full bg-fg transition-all ${checked ? "left-4.5" : "left-0.5"}`} />
    </button>
  );
}
