"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Estado de la demo persistido en localStorage y compartido entre componentes (y pestañas).
 * El servidor siempre renderiza el valor inicial; el cliente lo reemplaza por el guardado
 * después de hidratar, así no hay diferencias de hidratación.
 */
const PREFIX = "nodo.v1.";
const cache = new Map<string, unknown>();
const listeners = new Map<string, Set<() => void>>();

function read<T>(key: string, initial: T): T {
  if (!cache.has(key)) {
    let value: unknown = initial;
    try {
      const raw = window.localStorage.getItem(PREFIX + key);
      if (raw !== null) value = JSON.parse(raw);
    } catch {
      // Almacenamiento bloqueado o dato corrupto: se usa el valor inicial.
    }
    cache.set(key, value);
  }
  return cache.get(key) as T;
}

function emit(key: string) {
  listeners.get(key)?.forEach((l) => l());
}

export function writeStore<T>(key: string, value: T) {
  cache.set(key, value);
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Sin persistencia (modo privado, cuota llena): el estado sigue vivo en memoria.
  }
  emit(key);
}

function subscribe(key: string, listener: () => void) {
  let set = listeners.get(key);
  if (!set) listeners.set(key, (set = new Set()));
  set.add(listener);
  return () => set.delete(listener);
}

// Otra pestaña modificó el estado (p. ej. el staff respondió un ticket): se invalida la caché.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (!e.key?.startsWith(PREFIX)) return;
    const key = e.key.slice(PREFIX.length);
    cache.delete(key);
    emit(key);
  });
}

type Updater<T> = T | ((prev: T) => T);

/** `initial` debe ser una referencia estable (una constante de módulo). */
export function useLocalStore<T>(key: string, initial: T) {
  const value = useSyncExternalStore(
    useCallback((l: () => void) => subscribe(key, l), [key]),
    () => read(key, initial),
    () => initial,
  );
  const set = useCallback(
    (u: Updater<T>) => writeStore(key, typeof u === "function" ? (u as (p: T) => T)(read(key, initial)) : u),
    [key, initial],
  );
  return [value, set] as const;
}

/** Lectura/escritura fuera de React (motor de órdenes, temporizadores). */
export function getStore<T>(key: string, initial: T): T {
  return read(key, initial);
}

/** Borra todos los datos de la demo y vuelve al estado inicial. */
export function resetDemoStore() {
  try {
    Object.keys(window.localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => window.localStorage.removeItem(k));
  } catch {
    // Nada que borrar.
  }
  const keys = [...cache.keys()];
  cache.clear();
  keys.forEach(emit);
}
