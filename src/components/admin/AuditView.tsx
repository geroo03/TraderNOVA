"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { MsIcon } from "@/components/ui/MsIcon";
import { Panel, table } from "@/components/ui/Page";
import { useToast } from "@/components/ui/Toast";
import { ExportButton } from "./AdminActions";
import { permissions, roleMatrix, staffMembers, staffRoles } from "@/lib/admin-data";
import { staffUser } from "@/lib/mock-data";
import { useLocalStore } from "@/lib/store/local-store";
import { KEYS } from "@/lib/store/demo-data";
import { pushAudit, useAuditStore } from "@/lib/store/hooks";

/** Log de auditoría completo + matriz de roles y permisos del staff. */
export function AuditView() {
  const toast = useToast();
  const [log] = useAuditStore();
  const [matrix, setMatrix] = useLocalStore(KEYS.roles, roleMatrix);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("Todos");
  const q = query.trim().toLowerCase();
  const rows = log.filter((l) => (role === "Todos" || l.role === role) && (!q || Object.values(l).join(" ").toLowerCase().includes(q)));
  const roles = ["Todos", ...new Set(log.map((l) => l.role))];

  function toggle(r: string, p: string) {
    if (r === "Administrador") {
      toast({ title: "El rol Administrador tiene todos los permisos", tone: "neutral" });
      return;
    }
    const has = matrix[r]?.includes(p);
    setMatrix((m) => ({ ...m, [r]: has ? m[r].filter((x) => x !== p) : [...(m[r] ?? []), p] }));
    pushAudit({ who: staffUser.fullName, role: "Administrador", action: has ? "Revocación de permiso" : "Asignación de permiso", ref: r, detail: p });
    toast({ title: has ? "Permiso revocado" : "Permiso asignado", text: `${r}: ${p}` });
  }

  return (
    <div className="flex flex-col gap-4">
      <Panel
        title="Log de auditoría inmutable"
        subtitle={`${log.length} eventos · incluye todo lo que hiciste en la vista staff durante la demo`}
        actions={
          <>
            <label className="flex items-center gap-2 rounded-lg bg-surface-high px-3 py-1.5">
              <MsIcon name="search" size={16} className="text-fg-subtle" />
              <span className="sr-only">Buscar en el log</span>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Operador, acción, referencia…" className="w-44 bg-transparent text-xs outline-none" />
            </label>
            <label className="sr-only" htmlFor="audit-role">
              Filtrar por rol
            </label>
            <select id="audit-role" value={role} onChange={(e) => setRole(e.target.value)} className="rounded-lg bg-surface-high px-2 py-1.5 text-xs">
              {roles.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
            <ExportButton kind="audit" label="CSV" variant="secondary" />
          </>
        }
      >
        <div className={table.wrap}>
          <table className={`${table.table} min-w-[900px]`}>
            <thead>
              <tr>
                {["Timestamp", "Operador / rol", "Acción", "Referencia", "Detalle", "Hash"].map((h) => (
                  <th key={h} className={table.th}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((l, i) => (
                <tr key={`${l.hash}-${i}`} className={table.row}>
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
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-xs text-fg-subtle">
                    Sin eventos para este filtro.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Panel title="Roles y permisos" subtitle="Tocá una celda para asignar o revocar (queda auditado)" className="min-w-0">
          <div className={table.wrap}>
            <table className={`${table.table} min-w-[680px]`}>
              <thead>
                <tr>
                  <th className={table.th}>Permiso</th>
                  {staffRoles.map((r) => (
                    <th key={r} className={`${table.th} text-center`}>
                      {r}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {permissions.map((p) => (
                  <tr key={p} className={table.row}>
                    <td className={table.td}>{p}</td>
                    {staffRoles.map((r) => {
                      const on = matrix[r]?.includes(p);
                      return (
                        <td key={r} className={`${table.td} text-center`}>
                          <button
                            type="button"
                            aria-pressed={on}
                            aria-label={`${p} para ${r}`}
                            onClick={() => toggle(r, p)}
                            className={`rounded-md p-1 ${on ? "text-positive hover:bg-positive/15" : "text-fg-subtle hover:bg-surface-higher"}`}
                          >
                            <MsIcon name={on ? "check_circle" : "do_not_disturb_on"} size={18} />
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
        <Panel title="Equipo staff" actions={<Badge>{staffMembers.length} usuarios</Badge>}>
          <ul className="flex flex-col gap-2">
            {staffMembers.map((m) => (
              <li key={m.email} className="flex items-center justify-between gap-2 rounded-lg bg-surface-high p-3 text-xs">
                <span>
                  <span className="block font-semibold">{m.name}</span>
                  <span className="text-fg-subtle">{m.email}</span>
                </span>
                <span className="text-right">
                  <Badge tone="primary">{m.role}</Badge>
                  <span className="block pt-1 text-[10px] text-fg-subtle">{m.lastSeen}</span>
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
