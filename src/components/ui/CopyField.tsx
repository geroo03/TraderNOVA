"use client";

import { useState } from "react";
import { MsIcon } from "./MsIcon";

/** Dato con botón "copiar". Muestra confirmación 2 s; si el portapapeles falla, lo informa. */
export function CopyField({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
    } catch {
      setState("error");
    }
    setTimeout(() => setState("idle"), 2000);
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-surface-high px-3 py-2">
      <div className="min-w-0">
        <p className="text-label uppercase text-fg-subtle">{label}</p>
        <p className={`truncate text-sm font-semibold ${mono ? "font-mono" : ""}`}>{value}</p>
      </div>
      <button
        type="button"
        onClick={copy}
        aria-label={`Copiar ${label}`}
        className={`shrink-0 rounded-md p-1.5 ${state === "copied" ? "text-positive" : state === "error" ? "text-negative" : "text-fg-subtle hover:bg-surface-higher hover:text-fg"}`}
      >
        <MsIcon name={state === "copied" ? "check" : "content_copy"} size={16} />
      </button>
      <span role="status" className="sr-only">
        {state === "copied" ? "Copiado" : state === "error" ? "No se pudo copiar" : ""}
      </span>
    </div>
  );
}
