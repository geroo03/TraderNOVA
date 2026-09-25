"use client";

import { useSyncExternalStore } from "react";

/**
 * Reloj compartido (resolución de 15 s) para el horario de rueda. Evita leer Date.now() durante el
 * render: el servidor no tiene hora (null) y el cliente la actualiza por suscripción.
 */
let now = typeof window === "undefined" ? 0 : Date.now();
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;

function subscribe(l: () => void) {
  now = Date.now();
  listeners.add(l);
  if (!timer) {
    timer = setInterval(() => {
      now = Date.now();
      listeners.forEach((fn) => fn());
    }, 15_000);
  }
  return () => {
    listeners.delete(l);
    if (!listeners.size && timer) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

export function useNow(): number | null {
  return useSyncExternalStore(
    subscribe,
    () => now,
    () => null,
  );
}
