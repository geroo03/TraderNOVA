/** Genera un archivo en el navegador y lo descarga; no pasa por ningún servidor. */
export function downloadFile(filename: string, content: string, mime = "text/csv;charset=utf-8") {
  // BOM para que Excel abra los acentos correctamente.
  const body = mime.startsWith("text/csv") ? `﻿${content}` : content;
  const url = URL.createObjectURL(new Blob([body], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Convierte filas en CSV escapando comillas, comas y saltos de línea. */
export function toCsv(header: string[], rows: (string | number | undefined)[][]): string {
  const cell = (v: string | number | undefined) => {
    const s = v === undefined ? "" : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [header, ...rows].map((r) => r.map(cell).join(",")).join("\n");
}

/** Fecha y hora locales para nombres de archivo y registros: 2025-02-18_1545. */
export function stamp(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`;
}

export function nowTime(): string {
  return new Date().toLocaleTimeString("es-AR", { hour12: false });
}

export function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase().slice(-5)}${Math.floor(Math.random() * 36).toString(36).toUpperCase()}`;
}
