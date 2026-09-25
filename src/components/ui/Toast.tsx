"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { MsIcon } from "./MsIcon";
import type { MsIconName } from "./ms-icon-names";

type ToastTone = "positive" | "negative" | "primary" | "neutral";

export interface ToastInput {
  title: string;
  text?: string;
  tone?: ToastTone;
}

interface ToastItem extends ToastInput {
  id: number;
}

const ToastContext = createContext<((t: ToastInput) => void) | null>(null);

const toneView: Record<ToastTone, { icon: MsIconName; cls: string }> = {
  positive: { icon: "check_circle", cls: "text-positive" },
  negative: { icon: "error", cls: "text-negative" },
  primary: { icon: "notifications_active", cls: "text-primary" },
  neutral: { icon: "check", cls: "text-fg-muted" },
};

/** Avisos flotantes para confirmar cada acción de la demo. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const next = useRef(0);

  const dismiss = useCallback((id: number) => setItems((prev) => prev.filter((t) => t.id !== id)), []);
  const toast = useCallback(
    (t: ToastInput) => {
      const id = ++next.current;
      setItems((prev) => [...prev.slice(-3), { ...t, id }]);
      setTimeout(() => dismiss(id), 4_500);
    },
    [dismiss],
  );

  return (
    <ToastContext value={toast}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2">
        {items.map((t) => {
          const v = toneView[t.tone ?? "positive"];
          return (
            <div key={t.id} role="status" className="pointer-events-auto flex items-start gap-2 rounded-xl border border-surface-highest bg-surface-higher p-3 shadow-xl">
              <MsIcon name={v.icon} size={18} className={`mt-px shrink-0 ${v.cls}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{t.title}</p>
                {t.text && <p className="text-xs text-fg-muted">{t.text}</p>}
              </div>
              <button type="button" aria-label="Cerrar aviso" onClick={() => dismiss(t.id)} className="rounded p-0.5 text-fg-subtle hover:text-fg">
                <MsIcon name="close" size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  // Fuera del provider (tests, páginas sueltas) no rompe: simplemente no muestra nada.
  return useMemo(() => ctx ?? (() => {}), [ctx]);
}
