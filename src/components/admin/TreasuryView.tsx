"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MsIcon } from "@/components/ui/MsIcon";
import { Panel, table } from "@/components/ui/Page";
import { Tabs } from "@/components/ui/Tabs";
import { treasuryLog, treasuryQueue, type TreasuryItem } from "@/lib/admin-data";
import { useToast } from "@/components/ui/Toast";
import { useLocalStore } from "@/lib/store/local-store";
import { KEYS } from "@/lib/store/demo-data";
import { pushAudit } from "@/lib/store/hooks";

type LogRow = (typeof treasuryLog)[number];
const SEED = { queue: treasuryQueue, log: treasuryLog as LogRow[] };
import { formatDecimal } from "@/lib/format";

type Filter = "all" | "withdrawals" | "observed" | "vip";

const money = (t: TreasuryItem) => `${t.currency === "USD" ? "U$S " : "$"}${formatDecimal(t.amount)}`;

export function TreasuryView() {
  const toast = useToast();
  const [state, setState] = useLocalStore(KEYS.treasury, SEED);
  const { queue, log } = state;
  const [batching, setBatching] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [inspectId, setInspectId] = useState<string | undefined>(treasuryQueue[0]?.id);

  const rows = queue.filter((t) =>
    filter === "all" ? true : filter === "withdrawals" ? t.kind === "RETIRO" && !t.observed : filter === "observed" ? t.observed : t.vip,
  );
  const inspected = queue.find((t) => t.id === inspectId);

  function resolve(ids: string[], approved: boolean) {
    resolveWith(ids, approved, "Martín Benítez");
  }

  function resolveWith(ids: string[], approved: boolean, operator: string) {
    const now = new Date().toLocaleTimeString("es-AR", { hour12: false });
    const items = queue.filter((t) => ids.includes(t.id));
    setState((prev) => ({
      queue: prev.queue.filter((t) => !ids.includes(t.id)),
      log: [
        ...items.map((t) => ({
          time: now,
          operator,
          op: `${t.kind === "RETIRO" ? "Retiro" : "Depósito"} ${approved ? "aprobado" : "rechazado"} · ${t.client}`,
          amount: `${t.kind === "RETIRO" ? "-" : "+"}${money(t)}`,
          ref: t.id,
          status: approved ? "Transferido" : "Rechazado",
        })),
        ...prev.log,
      ],
    }));
    for (const t of items)
      pushAudit({ who: operator, role: "Tesorería", action: `${t.kind === "RETIRO" ? "Retiro" : "Depósito"} ${approved ? "aprobado" : "rechazado"}`, ref: t.id, detail: `${t.client} · ${money(t)}` });
    toast({ title: `${items.length} movimiento(s) ${approved ? "aprobado(s)" : "rechazado(s)"}`, text: items.map((t) => t.id).join(", "), tone: approved ? "positive" : "neutral" });
    setChecked(new Set());
    setInspectId((cur) => (cur && ids.includes(cur) ? queue.find((t) => !ids.includes(t.id))?.id : cur));
  }

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Las operaciones con CUIT distinto al titular no se pueden aprobar en lote (control PLA).
  const approvable = [...checked].filter((id) => queue.find((t) => t.id === id)?.cuitMatch);

  // Validación de fondos para el retiro inspeccionado (valores de demo).
  const liquid = 15_420_000;
  const openBuys = 1_800_000;
  const residual = inspected ? liquid - openBuys - (inspected.kind === "RETIRO" && inspected.currency === "ARS" ? inspected.amount : 0) : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Panel
          title="Cola de aprobación"
          subtitle="Retiros y depósitos que requieren intervención manual"
          className="min-w-0"
          actions={
            <>
              <Button
                size="sm"
                variant="secondary"
                icon="sync"
                disabled={batching}
                onClick={() => {
                  // La conciliación automática solo libera lo que pasa todos los controles (CUIT espejo y sin observaciones).
                  const ok = queue.filter((t) => t.cuitMatch && !t.observed).map((t) => t.id);
                  setBatching(true);
                  setTimeout(() => {
                    setBatching(false);
                    if (ok.length) resolveWith(ok, true, "Bot STP COELSA");
                    else toast({ title: "Conciliación sin pendientes", text: "Lo que queda en cola requiere revisión manual.", tone: "neutral" });
                  }, 1_200);
                }}
              >
                {batching ? "Conciliando…" : "Conciliación automática (batch)"}
              </Button>
              <Button size="sm" variant="buy" icon="done_all" disabled={approvable.length === 0} onClick={() => resolve(approvable, true)}>
                Aprobar seleccionados ({approvable.length})
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-3">
            <Tabs
              label="Filtro de cola"
              value={filter}
              onChange={setFilter}
              items={[
                { id: "all", label: "Todas", count: queue.length },
                { id: "withdrawals", label: "Retiros a liberar", count: queue.filter((t) => t.kind === "RETIRO" && !t.observed).length },
                { id: "observed", label: "Observados", count: queue.filter((t) => t.observed).length },
                { id: "vip", label: "VIP / institucional", count: queue.filter((t) => t.vip).length },
              ]}
            />
            <div className={table.wrap}>
              <table className={`${table.table} min-w-[760px]`}>
                <thead>
                  <tr>
                    <th className={table.th}>
                      <span className="sr-only">Seleccionar</span>
                    </th>
                    {["Tipo · ID", "Cliente / cuenta", "Monto", "Banco", "Validación CUIT", "Riesgo"].map((h) => (
                      <th key={h} className={table.th}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((t) => (
                    <tr key={t.id} className={`${table.row} cursor-pointer ${inspectId === t.id ? "bg-primary-strong/10" : ""}`} onClick={() => setInspectId(t.id)}>
                      <td className={table.td} onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" aria-label={`Seleccionar ${t.id}`} checked={checked.has(t.id)} onChange={() => toggle(t.id)} className="accent-primary-strong" />
                      </td>
                      <td className={table.td}>
                        <Badge tone={t.kind === "RETIRO" ? "negative" : "positive"}>{t.kind}</Badge>
                        <span className="block pt-1 font-mono text-[10px] text-fg-subtle">{t.id}</span>
                      </td>
                      <td className={table.td}>
                        <button type="button" className="text-left font-semibold hover:text-primary" onClick={() => setInspectId(t.id)}>
                          {t.client}
                        </button>
                        <span className="block font-mono text-[10px] text-fg-subtle">Cta. {t.account}</span>
                      </td>
                      <td className={`${table.td} font-mono font-semibold`}>{money(t)}</td>
                      <td className={`${table.td} text-fg-subtle`}>{t.bank}</td>
                      <td className={table.td}>
                        <Badge tone={t.cuitMatch ? "positive" : "negative"}>
                          <MsIcon name={t.cuitMatch ? "check" : "close"} size={12} />
                          {t.cuitMatch ? "CUIT idéntico" : "CUIT de 3ro"}
                        </Badge>
                      </td>
                      <td className={`${table.td} text-fg-subtle`}>{t.risk}</td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-xs text-fg-subtle">
                        Cola vacía para este filtro.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-fg-subtle">Las operaciones con CUIT de terceros no se aprueban en lote: requieren revisión individual de Compliance.</p>
          </div>
        </Panel>

        {inspected ? (
          <Card className="flex flex-col gap-3 p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">Inspección de movimiento</h2>
              <Badge tone="primary" className="font-mono">#{inspected.id}</Badge>
            </div>
            <div className="rounded-lg bg-surface-high p-3">
              <p className="text-label uppercase text-fg-subtle">Solicitado por</p>
              <p className="font-semibold">{inspected.client}</p>
              <p className="font-mono text-[11px] text-fg-subtle">Cta. {inspected.account} · {inspected.bank}</p>
            </div>
            <p className="flex items-baseline justify-between">
              <span className="text-xs text-fg-subtle">Importe</span>
              <span className="font-mono text-xl font-bold">{money(inspected)}</span>
            </p>
            {inspected.kind === "RETIRO" && inspected.currency === "ARS" && (
              <dl className="flex flex-col gap-1 rounded-lg bg-surface-lowest p-3 font-mono text-xs">
                <div className="flex justify-between"><dt className="text-fg-subtle">Saldo líquido disponible</dt><dd>${formatDecimal(liquid)}</dd></div>
                <div className="flex justify-between"><dt className="text-fg-subtle">Órdenes de compra abiertas</dt><dd className="text-negative">-${formatDecimal(openBuys)}</dd></div>
                <div className="flex justify-between"><dt className="text-fg-subtle">Este retiro</dt><dd className="text-negative">-${formatDecimal(inspected.amount)}</dd></div>
                <div className="mt-1 flex justify-between border-t border-surface-higher pt-1 font-semibold">
                  <dt>Margen libre residual</dt>
                  <dd className={residual >= 0 ? "text-positive" : "text-negative"}>{residual >= 0 ? "" : "-"}${formatDecimal(Math.abs(residual))}</dd>
                </div>
              </dl>
            )}
            <ul className="flex flex-col gap-1 text-xs">
              {[
                ["CBU verificada por Interbanking", true],
                ["Validación CUIT espejo", inspected.cuitMatch],
                ["Legajo UIF vigente", !inspected.observed],
              ].map(([label, ok]) => (
                <li key={label as string} className="flex items-center justify-between rounded-md bg-surface-high px-2 py-1.5">
                  {label}
                  <MsIcon name={ok ? "check_circle" : "error"} size={16} className={ok ? "text-positive" : "text-negative"} />
                </li>
              ))}
            </ul>
            <Button variant="buy" icon="verified" disabled={!inspected.cuitMatch || residual < 0} onClick={() => resolve([inspected.id], true)}>
              Confirmar y firmar token bancario
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon="receipt_long"
                onClick={() => {
                  pushAudit({ who: "Martín Benítez", role: "Tesorería", action: "Pedido de comprobante", ref: inspected.id, detail: `Se solicitó comprobante de origen a ${inspected.client}.` });
                  toast({ title: "Comprobante solicitado", text: `Se notificó a ${inspected.client} por mail y en la app.`, tone: "primary" });
                }}
              >
                Pedir comprobante
              </Button>
              <Button variant="danger" size="sm" icon="block" onClick={() => resolve([inspected.id], false)}>
                Rechazar
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="flex items-center justify-center p-8 text-sm text-fg-subtle">Seleccioná un movimiento de la cola.</Card>
        )}
      </div>

      <Panel title="Registro de movimientos auditables" subtitle="Log de tesorería · trazabilidad para BCRA / CNV">
        <div className={table.wrap}>
          <table className={`${table.table} min-w-[760px]`}>
            <thead>
              <tr>
                {["Hora", "Operador / canal", "Operación", "Monto", "Identificador", "Estado final"].map((h) => (
                  <th key={h} className={table.th}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {log.map((l, i) => (
                <tr key={`${l.ref}-${i}`} className={table.row}>
                  <td className={`${table.td} font-mono text-fg-subtle`}>{l.time}</td>
                  <td className={table.td}>{l.operator}</td>
                  <td className={table.td}>{l.op}</td>
                  <td className={`${table.td} font-mono font-semibold`}>{l.amount}</td>
                  <td className={`${table.td} font-mono text-fg-subtle`}>{l.ref}</td>
                  <td className={table.td}>
                    <Badge tone={l.status === "Rechazado" ? "negative" : "positive"} pill>
                      {l.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
