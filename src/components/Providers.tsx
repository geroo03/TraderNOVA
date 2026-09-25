"use client";

import type { ReactNode } from "react";
import { ToastProvider } from "@/components/ui/Toast";
import { ThemeSync } from "@/components/layout/ThemeSync";

/** Providers globales (inversor, staff y páginas públicas). */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <ThemeSync />
      {children}
    </ToastProvider>
  );
}
