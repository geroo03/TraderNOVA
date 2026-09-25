"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { MsIcon } from "@/components/ui/MsIcon";

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "application/pdf"];

export interface UploadedFile {
  name: string;
  previewUrl: string | null;
}

/**
 * Zona de carga con validación de tipo y tamaño en el cliente.
 * Importante: esto es UX, no seguridad. Con backend, el servidor debe volver a validar
 * tipo real (magic bytes), tamaño y escanear el archivo.
 */
export function DniUpload({ onChange }: { onChange: (file: UploadedFile | null) => void }) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  // Liberar el object URL al reemplazar o desmontar para no perder memoria.
  useEffect(() => () => {
    if (file?.previewUrl) URL.revokeObjectURL(file.previewUrl);
  }, [file]);

  function accept(f: File | undefined) {
    if (!f) return;
    if (!ACCEPTED.includes(f.type)) {
      setError("Formato no admitido. Usá JPG, PNG o PDF.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setError("El archivo supera los 10 MB.");
      return;
    }
    setError(null);
    const next = { name: f.name, previewUrl: f.type.startsWith("image/") ? URL.createObjectURL(f) : null };
    setFile(next);
    onChange(next);
  }

  function clear() {
    setFile(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  if (file) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-positive/40 bg-positive/5 p-4">
        {file.previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- blob: local, next/image no aplica
          <img src={file.previewUrl} alt="Vista previa del dorso del DNI" className="max-h-48 w-full rounded-lg object-contain" />
        ) : (
          <p className="flex items-center gap-2 text-sm">
            <MsIcon name="picture_as_pdf" size={20} className="text-negative" /> {file.name}
          </p>
        )}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-xs text-positive">
            <MsIcon name="check_circle" size={14} /> Dorso cargado · código PDF417 legible (simulado)
          </span>
          <Button size="sm" variant="secondary" onClick={clear}>
            Cambiar foto
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          accept(e.dataTransfer.files[0]);
        }}
        className={`flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition ${
          dragging ? "border-primary bg-primary/10" : "border-surface-highest bg-surface-lowest hover:border-primary/60"
        }`}
      >
        <span className="flex size-12 items-center justify-center rounded-xl bg-surface-high text-primary">
          <MsIcon name="upload_file" size={24} />
        </span>
        <span className="text-base font-semibold">Arrastrá la foto del dorso acá o hacé clic para explorar</span>
        <span className="max-w-md text-xs text-fg-subtle">Asegurate de que el código de barras bidimensional (PDF417), huella y domicilio se vean nítidos y sin cortes.</span>
        <span className="text-label text-fg-subtle">JPG, PNG o PDF · Tamaño máximo 10 MB</span>
        <input ref={inputRef} id={inputId} type="file" accept={ACCEPTED.join(",")} className="sr-only" onChange={(e) => accept(e.target.files?.[0])} />
      </label>
      {error && (
        <p role="alert" className="text-xs text-negative">
          {error}
        </p>
      )}
    </div>
  );
}
