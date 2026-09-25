"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog, Field, fieldCls } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";
import { adminKpis, plaAlerts, treasuryLog } from "@/lib/admin-data";
import { downloadFile, stamp, toCsv } from "@/lib/download";
import { staffUser } from "@/lib/mock-data";
import { getStore } from "@/lib/store/local-store";
import { KEYS, SEED_ORDERS } from "@/lib/store/demo-data";
import { pushAudit, useAuditStore, useClientsStore } from "@/lib/store/hooks";
import type { LiveOrder } from "@/lib/trading";

const who = { who: staffUser.fullName, role: "Compliance" };

export function RefreshDmaButton() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="secondary"
      icon="refresh"
      disabled={busy}
      onClick={() => {
        setBusy(true);
        setTimeout(() => {
          setBusy(false);
          toast({ title: "Sesión DMA refrescada", text: "FIX BYMA_01_PROD reconectado · latencia 3 ms · 0 mensajes perdidos." });
          pushAudit({ ...who, action: "Refresco de sesión DMA", ref: "FIX BYMA_01_PROD", detail: "Reconexión manual sin pérdida de mensajes." });
        }, 1_200);
      }}
    >
      {busy ? "Reconectando…" : "Refrescar DMA"}
    </Button>
  );
}

type ExportKind = "cnv-daily" | "padron" | "bcra" | "cnv-regimen" | "audit";

/** Exportaciones regulatorias: generan un CSV con los datos actuales de la demo. */
export function ExportButton({ kind, label, variant = "primary" }: { kind: ExportKind; label: string; variant?: "primary" | "secondary" }) {
  const toast = useToast();
  const [clients] = useClientsStore();
  const [audit] = useAuditStore();

  function run() {
    const orders = getStore<LiveOrder[]>(KEYS.orders, SEED_ORDERS).filter((o) => !o.simulated);
    const files: Record<ExportKind, [string, string]> = {
      "cnv-daily": [
        "reporte-cnv-diario",
        toCsv(
          ["indicador", "valor"],
          [
            ["comitentes_activos", adminKpis.activeClients],
            ["altas_mes", adminKpis.newAccountsMonth],
            ["volumen_operado_ars", adminKpis.volumeToday],
            ["auc_millones_ars", adminKpis.aucM],
            ["ordenes_registradas_hoy", orders.length],
          ],
        ),
      ],
      padron: ["padron-cnv", toCsv(["cuenta", "titular", "cuit", "email", "estado", "riesgo", "alta", "patrimonio_ars"], clients.map((c) => [c.account, c.name, c.cuit, c.email, c.status, c.risk, c.since, c.equity]))],
      bcra: ["tesoreria-bcra-cnv", toCsv(["hora", "operador", "operacion", "monto", "referencia", "estado"], treasuryLog.map((l) => [l.time, l.operator, l.op, l.amount, l.ref, l.status]))],
      "cnv-regimen": ["regimen-informativo-cnv", toCsv(["orden", "especie", "operacion", "cantidad", "precio", "moneda", "estado"], orders.map((o) => [o.id, o.symbol, o.side, o.quantity, o.price, o.currency, o.status]))],
      audit: ["log-auditoria", toCsv(["timestamp", "operador", "rol", "accion", "referencia", "detalle", "hash"], audit.map((l) => [l.ts, l.who, l.role, l.action, l.ref, l.detail, l.hash]))],
    };
    const [name, content] = files[kind];
    downloadFile(`${name}_${stamp()}.csv`, content);
    toast({ title: "Exportación generada", text: `${name}.csv` });
    if (kind !== "audit") pushAudit({ ...who, action: "Exportación regulatoria", ref: name, detail: `Descarga de ${label}.` });
  }

  return (
    <Button variant={variant} icon="download" onClick={run}>
      {label}
    </Button>
  );
}

/** Genera un Reporte de Operación Sospechosa (ROS) a partir de una alerta PLA/FT. */
export function RosReportButton() {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [alertId, setAlertId] = useState(plaAlerts[0].id);
  const [reason, setReason] = useState("");
  const alert = plaAlerts.find((a) => a.id === alertId)!;

  function submit() {
    if (reason.trim().length < 20) return;
    const body = [
      "REPORTE DE OPERACIÓN SOSPECHOSA (ROS) — DEMO",
      `Sujeto obligado: Nodo Broker S.A. · ALyC Nº 942`,
      `Fecha: ${new Date().toLocaleString("es-AR")}`,
      `Oficial de cumplimiento: ${staffUser.fullName}`,
      "",
      `Sujeto reportado: ${alert.subject}`,
      `Referencia: ${alert.ref}`,
      `Alerta: ${alert.level}`,
      `Hechos: ${alert.text}`,
      "",
      `Fundamentación: ${reason.trim()}`,
    ].join("\n");
    downloadFile(`ROS-${alert.id}_${stamp()}.txt`, body, "text/plain;charset=utf-8");
    pushAudit({ ...who, action: "Emisión de ROS a UIF", ref: alert.ref, detail: reason.trim().slice(0, 120) });
    toast({ title: "ROS generado", text: `${alert.subject}: se descargó el borrador para presentar ante la UIF.` });
    setOpen(false);
    setReason("");
  }

  return (
    <>
      <Button variant="sell" icon="report" onClick={() => setOpen(true)}>
        Generar reporte ROS / UIF
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Generar reporte ROS"
        description="Queda registrado en el log de auditoría"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button variant="sell" icon="report" disabled={reason.trim().length < 20} onClick={submit}>
              Emitir y descargar
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <Field label="Alerta de origen">
            <select value={alertId} onChange={(e) => setAlertId(e.target.value)} className={fieldCls}>
              {plaAlerts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.subject} · {a.level}
                </option>
              ))}
            </select>
          </Field>
          <p className="rounded-lg bg-surface-high p-3 text-xs text-fg-muted">{alert.text}</p>
          <Field label="Fundamentación del oficial" hint="Mínimo 20 caracteres" error={reason && reason.trim().length < 20 ? "Ampliá la fundamentación." : null}>
            <textarea rows={4} value={reason} onChange={(e) => setReason(e.target.value)} className={fieldCls} />
          </Field>
        </div>
      </Dialog>
    </>
  );
}
