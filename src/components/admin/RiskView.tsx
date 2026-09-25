"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog, Field, fieldCls, Switch } from "@/components/ui/Dialog";
import { Panel, Stat, table } from "@/components/ui/Page";
import { useToast } from "@/components/ui/Toast";
import { riskLimits, type RiskLimit } from "@/lib/admin-data";
import { formatInteger } from "@/lib/format";
import { staffUser } from "@/lib/mock-data";
import { useLocalStore } from "@/lib/store/local-store";
import { KEYS } from "@/lib/store/demo-data";
import { pushAudit, useClientsStore } from "@/lib/store/hooks";

const GLOBAL = { priceBand: 5, maxOrder: 50_000_000, minCollateral: 80 };
const SEED = { limits: riskLimits, global: GLOBAL };
const audit = (action: string, ref: string, detail: string) => pushAudit({ who: staffUser.fullName, role: "Riesgo", action, ref, detail });

function usageTone(pct: number) {
  return pct >= 90 ? "bg-alert" : pct >= 70 ? "bg-[#f5b942]" : "bg-positive";
}

/** Límites de exposición por comitente, aforos de caución y parámetros globales de riesgo. */
export function RiskView() {
  const toast = useToast();
  const [clients] = useClientsStore();
  const [state, setState] = useLocalStore(KEYS.riskLimits, SEED);
  const [editing, setEditing] = useState<RiskLimit | null>(null);
  const [draft, setDraft] = useState(0);
  const [global, setGlobal] = useState<typeof GLOBAL | null>(null);
  const g = global ?? state.global;

  const rows = state.limits.map((l) => ({ ...l, client: clients.find((c) => c.id === l.clientId) })).filter((r) => r.client);
  const calls = rows.filter((r) => r.collateral < state.global.minCollateral);
  const update = (clientId: string, patch: Partial<RiskLimit>) => setState((s) => ({ ...s, limits: s.limits.map((l) => (l.clientId === clientId ? { ...l, ...patch } : l)) }));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Exposición total en uso" value={<span className="text-lg">${formatInteger(rows.reduce((a, r) => a + r.used, 0))}</span>} hint={`de $${formatInteger(rows.reduce((a, r) => a + r.exposureLimit, 0))} asignados`} />
        <Stat label="Comitentes > 90% del límite" value={<span className="text-negative">{rows.filter((r) => r.exposureLimit && r.used / r.exposureLimit >= 0.9).length}</span>} badge={<Badge tone="negative">Vigilar</Badge>} />
        <Stat label="Margin calls" value={<span className="text-negative">{calls.length}</span>} badge={<Badge tone="negative">Aforo &lt; {state.global.minCollateral}%</Badge>} />
        <Stat label="Banda de precios" value={`±${state.global.priceBand}%`} hint="Rechazo automático fuera de banda" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Panel title="Límites por comitente" subtitle="Exposición en rueda, aforo de garantías y apalancamiento" className="min-w-0">
          <div className={table.wrap}>
            <table className={`${table.table} min-w-[820px]`}>
              <thead>
                <tr>
                  {["Comitente", "Uso del límite", "Límite", "Aforo", "Apalancamiento", ""].map((h) => (
                    <th key={h} className={table.th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const pct = r.exposureLimit ? Math.min(100, (r.used / r.exposureLimit) * 100) : 0;
                  return (
                    <tr key={r.clientId} className={table.row}>
                      <td className={table.td}>
                        <span className="block font-semibold">{r.client!.name}</span>
                        <span className="font-mono text-[10px] text-fg-subtle">
                          {r.client!.account} · riesgo {r.client!.risk}
                        </span>
                      </td>
                      <td className={`${table.td} w-48`}>
                        <div className="h-2 overflow-hidden rounded-full bg-surface-higher" role="img" aria-label={`Uso ${Math.round(pct)}%`}>
                          <div className={`h-full ${usageTone(pct)}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="font-mono text-[10px] text-fg-subtle">
                          ${formatInteger(r.used)} · {Math.round(pct)}%
                        </span>
                      </td>
                      <td className={`${table.td} font-mono`}>{r.exposureLimit ? `$${formatInteger(r.exposureLimit)}` : <Badge tone="negative">Operatoria suspendida</Badge>}</td>
                      <td className={`${table.td} font-mono ${r.collateral < state.global.minCollateral ? "text-negative" : ""}`}>{r.collateral}%</td>
                      <td className={table.td}>
                        <Switch
                          label={`Apalancamiento de ${r.client!.name}`}
                          checked={r.leverage}
                          onChange={(v) => {
                            update(r.clientId, { leverage: v });
                            audit(v ? "Habilitación de apalancamiento" : "Baja de apalancamiento", r.client!.account, r.client!.name);
                            toast({ title: v ? "Apalancamiento habilitado" : "Apalancamiento deshabilitado", text: r.client!.name, tone: "neutral" });
                          }}
                        />
                      </td>
                      <td className={`${table.td} text-right`}>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setEditing(r);
                            setDraft(r.exposureLimit);
                          }}
                        >
                          Editar límite
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>

        <div className="flex flex-col gap-4">
          <Panel title="Margin calls" actions={<Badge tone="negative">{calls.length}</Badge>}>
            <ul className="flex flex-col gap-2">
              {calls.map((r) => (
                <li key={r.clientId} className="flex flex-col gap-2 rounded-lg border-l-4 border-alert bg-surface-high p-3 text-xs">
                  <p className="font-semibold">{r.client!.name}</p>
                  <p className="text-fg-subtle">
                    Aforo {r.collateral}% (mínimo {state.global.minCollateral}%). Debe reponer garantías o se liquidan posiciones.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="sell"
                      onClick={() => {
                        audit("Margin call enviado", r.client!.account, `Aforo ${r.collateral}%`);
                        toast({ title: "Margin call enviado", text: `${r.client!.name} tiene 24 hs para reponer garantías.`, tone: "negative" });
                      }}
                    >
                      Enviar margin call
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        update(r.clientId, { collateral: 100 });
                        audit("Reposición de garantías registrada", r.client!.account, "Aforo normalizado a 100%");
                        toast({ title: "Garantías repuestas", text: r.client!.name });
                      }}
                    >
                      Registrar reposición
                    </Button>
                  </div>
                </li>
              ))}
              {calls.length === 0 && <li className="text-xs text-fg-subtle">Sin comitentes por debajo del aforo mínimo.</li>}
            </ul>
          </Panel>

          <Panel title="Parámetros globales">
            <div className="flex flex-col gap-3">
              <Field label="Banda de precios (%)" hint="Órdenes más lejos del último precio se rechazan">
                <input type="number" min={1} max={30} value={g.priceBand} onChange={(e) => setGlobal({ ...g, priceBand: Number(e.target.value) })} className={fieldCls} />
              </Field>
              <Field label="Tamaño máximo por orden (ARS)">
                <input type="number" min={0} value={g.maxOrder} onChange={(e) => setGlobal({ ...g, maxOrder: Number(e.target.value) })} className={fieldCls} />
              </Field>
              <Field label="Aforo mínimo de caución (%)">
                <input type="number" min={50} max={100} value={g.minCollateral} onChange={(e) => setGlobal({ ...g, minCollateral: Number(e.target.value) })} className={fieldCls} />
              </Field>
              <Button
                icon="save"
                disabled={!global}
                onClick={() => {
                  setState((s) => ({ ...s, global: g }));
                  setGlobal(null);
                  audit("Cambio de parámetros de riesgo", "Global", `Banda ±${g.priceBand}% · máx. $${formatInteger(g.maxOrder)} · aforo ${g.minCollateral}%`);
                  toast({ title: "Parámetros guardados" });
                }}
              >
                Guardar parámetros
              </Button>
            </div>
          </Panel>
        </div>
      </div>

      <Dialog
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Editar límite de exposición"
        description={editing ? clients.find((c) => c.id === editing.clientId)?.name : ""}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button
              icon="save"
              disabled={draft < 0}
              onClick={() => {
                if (!editing) return;
                const c = clients.find((x) => x.id === editing.clientId);
                update(editing.clientId, { exposureLimit: draft });
                audit("Modificación de límite operativo", c?.account ?? editing.clientId, `$${formatInteger(editing.exposureLimit)} → $${formatInteger(draft)}`);
                toast({ title: "Límite actualizado", text: `${c?.name}: $${formatInteger(draft)}` });
                setEditing(null);
              }}
            >
              Guardar
            </Button>
          </>
        }
      >
        <Field label="Nuevo límite (ARS)" hint="0 suspende la operatoria del comitente">
          <input type="number" min={0} step={100_000} value={draft} onChange={(e) => setDraft(Number(e.target.value))} className={`${fieldCls} font-mono text-lg`} />
        </Field>
      </Dialog>
    </div>
  );
}
