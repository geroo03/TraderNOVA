"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MsIcon } from "@/components/ui/MsIcon";
import { Panel, table } from "@/components/ui/Page";
import { auditLog, clients, docExpirations, plaAlerts, riskMatrix } from "@/lib/admin-data";
import { formatDecimal } from "@/lib/format";

type AlertState = "open" | "archived" | "ros" | "requested";

export function ComplianceView() {
  const [states, setStates] = useState<Record<string, AlertState>>({});
  const [query, setQuery] = useState("");
  const [batchSent, setBatchSent] = useState(false);
  const open = plaAlerts.filter((a) => (states[a.id] ?? "open") !== "archived");
  const q = query.trim().toLowerCase();
  const logRows = auditLog.filter((l) => !q || Object.values(l).join(" ").toLowerCase().includes(q));
  const riskRows = clients.filter((c) => c.risk !== "Bajo");

  function act(id: string, action: string) {
    const next: AlertState = action.startsWith("Archivar") ? "archived" : action.startsWith("Emitir") ? "ros" : "requested";
    setStates((s) => ({ ...s, [id]: next }));
  }

  function downloadLog() {
    const csv = ["timestamp,operador,rol,accion,referencia,detalle,hash", ...auditLog.map((l) => [l.ts, l.who, l.role, l.action, l.ref, `"${l.detail}"`, l.hash].join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "log-auditoria-nodo.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-4">
      <Panel title={<><MsIcon name="crisis_alert" size={18} className="text-negative" /> Alertas de operaciones inusuales y pre-ROS</>} subtitle="Live feed del motor de reglas PLA/FT" actions={<Badge tone="negative">{open.length} abiertas</Badge>}>
        <ul className="flex flex-col gap-3">
          {open.map((a) => {
            const st = states[a.id] ?? "open";
            return (
              <li key={a.id} className={`flex flex-col gap-2 rounded-lg border-l-4 bg-surface-high p-3 ${a.tone === "negative" ? "border-alert" : a.tone === "primary" ? "border-primary" : "border-fg-subtle"}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={a.tone} className="uppercase">{a.level}</Badge>
                  <span className="font-semibold">{a.subject}</span>
                  <span className="font-mono text-[10px] text-fg-subtle">{a.ref}</span>
                  {st === "ros" && <Badge tone="negative">ROS emitido a UIF</Badge>}
                  {st === "requested" && <Badge tone="primary">Justificación solicitada</Badge>}
                </div>
                <p className="text-xs text-fg-muted">{a.text}</p>
                <div className="flex flex-wrap justify-end gap-2">
                  {a.actions.map((label) => (
                    <Button
                      key={label}
                      size="sm"
                      variant={label.startsWith("Emitir") ? "sell" : label.startsWith("Archivar") ? "ghost" : "secondary"}
                      disabled={st === "ros"}
                      onClick={() => act(a.id, label)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </li>
            );
          })}
          {open.length === 0 && <li className="text-xs text-fg-subtle">Sin alertas abiertas.</li>}
        </ul>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Panel title="Matriz de riesgo de comitentes" subtitle="Scoring UIF / KYC de la cartera total" className="min-w-0">
          <div className="flex h-3 overflow-hidden rounded-full" role="img" aria-label={`Riesgo bajo ${riskMatrix.bajo}%, medio ${riskMatrix.medio}%, alto ${riskMatrix.alto}%, inaceptable ${riskMatrix.inaceptable}%`}>
            <span className="bg-positive" style={{ width: `${riskMatrix.bajo}%` }} />
            <span className="bg-primary" style={{ width: `${riskMatrix.medio}%` }} />
            <span className="bg-[#f5b942]" style={{ width: `${riskMatrix.alto}%` }} />
            <span className="bg-alert" style={{ width: `${riskMatrix.inaceptable}%` }} />
          </div>
          <ul className="flex flex-wrap gap-3 pt-2 text-[11px] text-fg-subtle">
            <li className="flex items-center gap-1"><span className="size-2 rounded-full bg-positive" /> Bajo {riskMatrix.bajo}%</li>
            <li className="flex items-center gap-1"><span className="size-2 rounded-full bg-primary" /> Medio {riskMatrix.medio}%</li>
            <li className="flex items-center gap-1"><span className="size-2 rounded-full bg-[#f5b942]" /> Alto / PEP {riskMatrix.alto}%</li>
            <li className="flex items-center gap-1"><span className="size-2 rounded-full bg-alert" /> Inaceptable {riskMatrix.inaceptable}%</li>
          </ul>
          <div className={`${table.wrap} pt-3`}>
            <table className={`${table.table} min-w-[520px]`}>
              <thead>
                <tr>
                  {["Comitente", "CUIT", "Calificación", "Patrimonio"].map((h) => (
                    <th key={h} className={table.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {riskRows.map((c) => (
                  <tr key={c.id} className={table.row}>
                    <td className={`${table.td} font-semibold`}>{c.name}</td>
                    <td className={`${table.td} font-mono text-fg-subtle`}>{c.cuit}</td>
                    <td className={table.td}>
                      <Badge tone={c.risk === "Alto" ? "negative" : "primary"}>{c.risk.toUpperCase()}{c.status === "pep" ? " · PEP" : ""}</Badge>
                    </td>
                    <td className={`${table.td} font-mono`}>${formatDecimal(c.equity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Vencimientos de documentación" actions={<Badge tone="negative">{docExpirations.filter((d) => d.critical).length} críticos</Badge>}>
          <ul className="flex flex-col gap-2">
            {docExpirations.map((d) => (
              <li key={d.who} className="rounded-lg bg-surface-high p-3 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{d.who}</span>
                  <Badge tone={d.critical ? "negative" : "neutral"}>{d.due}</Badge>
                </div>
                <p className="pt-1 text-fg-subtle">{d.what}</p>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-2 pt-3">
            <Button variant="secondary" icon="forward_to_inbox" disabled={batchSent} onClick={() => setBatchSent(true)}>
              {batchSent ? "Intimación enviada" : "Ejecutar intimación automática (batch)"}
            </Button>
            {batchSent && <p role="status" className="text-xs text-positive">Se notificó a {docExpirations.length} comitentes (demo).</p>}
          </div>
        </Panel>
      </div>

      <Panel
        title="Log de auditoría inmutable"
        subtitle="Trazabilidad regulatoria · cada acción queda firmada con hash"
        actions={
          <>
            <label className="flex items-center gap-2 rounded-lg bg-surface-high px-3 py-1.5">
              <MsIcon name="search" size={16} className="text-fg-subtle" />
              <span className="sr-only">Buscar en el log</span>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar en el log…" className="w-36 bg-transparent text-xs outline-none" />
            </label>
            <Button size="sm" variant="secondary" icon="download" onClick={downloadLog}>
              Descargar CSV
            </Button>
          </>
        }
      >
        <div className={table.wrap}>
          <table className={`${table.table} min-w-[900px]`}>
            <thead>
              <tr>
                {["Timestamp", "Operador / rol", "Acción", "Referencia", "Detalle & justificación", "Hash"].map((h) => (
                  <th key={h} className={table.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logRows.map((l) => (
                <tr key={l.hash} className={table.row}>
                  <td className={`${table.td} font-mono text-fg-subtle`}>{l.ts}</td>
                  <td className={table.td}>
                    <span className="block font-semibold">{l.who}</span>
                    <span className="text-[10px] text-fg-subtle">{l.role}</span>
                  </td>
                  <td className={table.td}>{l.action}</td>
                  <td className={`${table.td} font-mono`}>{l.ref}</td>
                  <td className={`${table.td} whitespace-normal text-fg-subtle`}>{l.detail}</td>
                  <td className={`${table.td} font-mono text-[10px] text-fg-subtle`}>{l.hash}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
