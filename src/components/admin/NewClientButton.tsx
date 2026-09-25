"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog, Field, fieldCls } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";
import { pushAudit, useClientsStore } from "@/lib/store/hooks";
import type { Client } from "@/lib/admin-data";
import { staffUser } from "@/lib/mock-data";

const CUIT_RE = /^\d{2}-\d{8}-\d$/;
const EMPTY = { name: "", cuit: "", email: "", phone: "", occupation: "", address: "", risk: "Bajo" as Client["risk"] };

/** Alta manual de comitente: entra en la cola de KYC para que Compliance lo apruebe. */
export function NewClientButton() {
  const toast = useToast();
  const [, setClients] = useClientsStore();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(EMPTY);
  const [tried, setTried] = useState(false);
  const errors = {
    name: f.name.trim().length >= 3 ? null : "Ingresá nombre y apellido o razón social.",
    cuit: CUIT_RE.test(f.cuit) ? null : "Formato 20-12345678-9.",
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email) ? null : "Correo inválido.",
  };

  function submit() {
    setTried(true);
    if (errors.name || errors.cuit || errors.email) return;
    const n = 90_000 + Math.floor(Math.random() * 9_999);
    const client: Client = {
      id: `c-${n}`,
      name: f.name.trim(),
      initials: f.name.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase(),
      account: `#${n}`,
      cuit: f.cuit,
      email: f.email,
      phone: f.phone || "—",
      status: "kyc",
      since: new Date().toLocaleDateString("es-AR"),
      equity: 0,
      equityUsd: 0,
      risk: f.risk,
      occupation: f.occupation || "Sin declarar",
      address: f.address || "Sin declarar",
      alert: "Alta manual: falta validar identidad con Renaper y justificación de fondos.",
    };
    setClients((prev) => [client, ...prev]);
    pushAudit({ who: staffUser.fullName, role: "Compliance", action: "Alta manual de comitente", ref: client.account, detail: `${client.name} · CUIT ${client.cuit}` });
    toast({ title: "Comitente dado de alta", text: `${client.name} (${client.account}) quedó en la cola de KYC.` });
    setOpen(false);
    setF(EMPTY);
    setTried(false);
  }

  return (
    <>
      <Button icon="person_add" onClick={() => setOpen(true)}>
        Alta manual de comitente
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Alta manual de comitente"
        description="Queda pendiente de KYC hasta que Compliance lo apruebe"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button icon="person_add" onClick={submit}>
              Crear comitente
            </Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nombre / razón social" error={tried ? errors.name : null}>
            <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={fieldCls} />
          </Field>
          <Field label="CUIT / CUIL" error={tried ? errors.cuit : null}>
            <input value={f.cuit} onChange={(e) => setF({ ...f, cuit: e.target.value })} placeholder="20-12345678-9" className={`${fieldCls} font-mono`} />
          </Field>
          <Field label="Correo" error={tried ? errors.email : null}>
            <input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className={fieldCls} />
          </Field>
          <Field label="Teléfono">
            <input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} className={fieldCls} />
          </Field>
          <Field label="Actividad declarada">
            <input value={f.occupation} onChange={(e) => setF({ ...f, occupation: e.target.value })} className={fieldCls} />
          </Field>
          <Field label="Riesgo inicial">
            <select value={f.risk} onChange={(e) => setF({ ...f, risk: e.target.value as Client["risk"] })} className={fieldCls}>
              <option>Bajo</option>
              <option>Medio</option>
              <option>Alto</option>
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Domicilio fiscal">
              <input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} className={fieldCls} />
            </Field>
          </div>
        </div>
      </Dialog>
    </>
  );
}
