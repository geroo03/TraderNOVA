"use client";

import { useMemo, useState } from "react";
import { Badge, StatusDot, type Tone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MsIcon } from "@/components/ui/MsIcon";
import type { MsIconName } from "@/components/ui/ms-icon-names";
import { Panel, table } from "@/components/ui/Page";
import type { ClientStatus } from "@/lib/admin-data";
import { useToast } from "@/components/ui/Toast";
import { isInvestorAccount, pushAudit, pushNotification, useClientsStore } from "@/lib/store/hooks";
import { staffUser } from "@/lib/mock-data";
import { formatDecimal } from "@/lib/format";

const statusView: Record<ClientStatus, { label: string; tone: Tone }> = {
  activo: { label: "Activo", tone: "positive" },
  kyc: { label: "KYC pendiente (Nivel 3)", tone: "negative" },
  bloqueado: { label: "Bloqueado (UIF / Oficio)", tone: "negative" },
  pep: { label: "PEP (en vigilancia)", tone: "primary" },
};

type Filter = "all" | ClientStatus;

const DOCS: { label: string; icon: MsIconName }[] = [
  { label: "DNI frente", icon: "badge" },
  { label: "DNI dorso", icon: "qr_code_2" },
  { label: "Prueba de vida", icon: "face" },
];

export function ClientsView({ initialFilter = "all", initialQuery = "" }: { initialFilter?: Filter; initialQuery?: string }) {
  const toast = useToast();
  const [list, setList] = useClientsStore();
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [query, setQuery] = useState(initialQuery);
  const [pickedId, setSelectedId] = useState<string | null>(null);
  // Sin selección explícita se muestra el primero que coincide con el filtro/búsqueda.
  const selectedId = pickedId ?? list.find((c) => (initialFilter === "all" || c.status === initialFilter) && (!initialQuery || c.name === initialQuery))?.id ?? list[0]?.id;
  const [note, setNote] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list
      .filter((c) => filter === "all" || c.status === filter)
      .filter((c) => !q || `${c.name} ${c.cuit} ${c.account} ${c.email}`.toLowerCase().includes(q));
  }, [list, filter, query]);

  const selected = list.find((c) => c.id === selectedId);
  const count = (s: ClientStatus) => list.filter((c) => c.status === s).length;

  function setStatus(id: string, status: ClientStatus, msg: string) {
    const c = list.find((x) => x.id === id);
    setList((prev) => prev.map((x) => (x.id === id ? { ...x, status, alert: status === "activo" ? undefined : x.alert } : x)));
    setNote(msg);
    toast({ title: status === "activo" ? "Comitente aprobado" : "Comitente bloqueado", text: c?.name, tone: status === "activo" ? "positive" : "negative" });
    pushAudit({ who: staffUser.fullName, role: "Compliance", action: status === "activo" ? "Aprobación de legajo KYC" : "Bloqueo de comitente", ref: c?.account ?? id, detail: msg });
    // El inversor de la demo ve el cambio en su app: se bloquea o habilita la operatoria.
    if (c && isInvestorAccount(c.account))
      pushNotification(
        status === "activo"
          ? { title: "Tu cuenta está habilitada", text: "Compliance aprobó tu legajo: ya podés operar y retirar fondos.", tone: "positive", href: "/operar" }
          : { title: "Tu cuenta fue restringida", text: "Compliance bloqueó la operatoria de tu cuenta. Escribinos desde Soporte.", tone: "negative", href: "/soporte" },
      );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex min-w-60 flex-1 items-center gap-2 rounded-lg bg-surface px-3 py-2">
          <MsIcon name="search" size={16} className="text-fg-subtle" />
          <span className="sr-only">Buscar comitente</span>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por nombre, CUIT, cuenta o email…" className="w-full bg-transparent text-xs outline-none" />
        </label>
        <div className="flex flex-wrap gap-1" role="group" aria-label="Estado">
          {(
            [
              ["all", "Todos", list.length],
              ["kyc", "KYC pendiente", count("kyc")],
              ["activo", "Activos", count("activo")],
              ["bloqueado", "Bloqueados", count("bloqueado")],
              ["pep", "PEP / UIF", count("pep")],
            ] as [Filter, string, number][]
          ).map(([id, label, n]) => (
            <button
              key={id}
              type="button"
              aria-pressed={filter === id}
              onClick={() => setFilter(id)}
              className={`text-label rounded-md px-2 py-1.5 ${filter === id ? "bg-primary text-on-primary" : "bg-surface-high text-fg-muted"}`}
            >
              {label} · {n}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,1fr)_420px]">
        <Panel title="Registro maestro de comitentes" subtitle="BYMA / MAE · padrón sincronizado con Caja de Valores" className="min-w-0">
          <div className={table.wrap}>
            <table className={`${table.table} min-w-[820px]`}>
              <thead>
                <tr>
                  {["Comitente / titular", "Contacto verificado", "Estado operativo", "Alta", "Patrimonio", ""].map((h) => (
                    <th key={h} className={table.th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => {
                  const s = statusView[c.status];
                  return (
                    <tr key={c.id} className={`${table.row} ${selectedId === c.id ? "bg-primary-strong/10" : ""}`}>
                      <td className={table.td}>
                        <span className="flex items-center gap-2">
                          <span className="flex size-8 items-center justify-center rounded-md bg-surface-higher font-mono text-[11px] font-bold text-primary">{c.initials}</span>
                          <span>
                            <span className="block font-semibold">{c.name}</span>
                            <span className="font-mono text-[10px] text-fg-subtle">
                              {c.account} · {c.cuit}
                            </span>
                          </span>
                        </span>
                      </td>
                      <td className={table.td}>
                        <span className="block">{c.email}</span>
                        <span className="text-[10px] text-fg-subtle">{c.phone}</span>
                      </td>
                      <td className={table.td}>
                        <Badge tone={s.tone} pill>
                          <StatusDot tone={s.tone} /> {s.label}
                        </Badge>
                      </td>
                      <td className={`${table.td} font-mono text-fg-subtle`}>{c.since}</td>
                      <td className={`${table.td} font-mono`}>
                        <span className="block font-semibold">${formatDecimal(c.equity)}</span>
                        <span className="text-[10px] text-fg-subtle">USD {formatDecimal(c.equityUsd)}</span>
                      </td>
                      <td className={`${table.td} text-right`}>
                        <Button
                          size="sm"
                          variant={c.status === "kyc" ? "primary" : "secondary"}
                          onClick={() => {
                            setSelectedId(c.id);
                            setNote(null);
                          }}
                        >
                          {c.status === "kyc" ? "Auditar legajo" : "Ver legajo"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-xs text-fg-subtle">
                      Sin comitentes para este filtro.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="pt-3 text-xs text-fg-subtle">Mostrando {rows.length} de {list.length} comitentes de la muestra (padrón real: 18.420)</p>
        </Panel>

        {selected && (
          <Card className="flex flex-col gap-4 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-label text-fg-subtle">{selected.account} · Legajo digital</p>
                <h2 className="text-lg font-bold">{selected.name}</h2>
                <p className="font-mono text-[11px] text-fg-subtle">CUIT {selected.cuit} · Riesgo {selected.risk}</p>
              </div>
              <Badge tone={statusView[selected.status].tone}>{statusView[selected.status].label}</Badge>
            </div>

            {selected.alert && (
              <p className="flex gap-2 rounded-lg bg-alert/10 p-3 text-xs text-negative">
                <MsIcon name="warning" size={16} className="mt-0.5" />
                {selected.alert}
              </p>
            )}

            <div>
              <div className="flex items-center justify-between pb-2">
                <p className="text-label uppercase text-fg-subtle">Documentación & biometría Renaper</p>
                <Badge tone="positive">Match score 98,4%</Badge>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {DOCS.map(({ label, icon }) => (
                  <figure key={label} className="flex flex-col items-center gap-1 rounded-lg bg-surface-high p-3">
                    <MsIcon name={icon} size={28} className="text-fg-subtle" />
                    <figcaption className="text-[10px] text-fg-subtle">{label}</figcaption>
                  </figure>
                ))}
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-xs">
              {[
                ["Actividad declarada", selected.occupation],
                ["Domicilio fiscal", selected.address],
                ["Categoría PEP", selected.status === "pep" ? "Sí (funcionario)" : "No"],
                ["Patrimonio valorizado", `$${formatDecimal(selected.equity)}`],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-label uppercase text-fg-subtle">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>

            <ul className="flex flex-col gap-1 text-xs">
              {[
                ["Validación de identidad Renaper vs. biometría", true],
                ["Constancia AFIP: inscripción y actividad", true],
                ["Listas de terroristas / sanciones (UIF, OFAC)", true],
                ["Justificación de origen de fondos", selected.status !== "kyc"],
              ].map(([label, ok]) => (
                <li key={label as string} className="flex items-center justify-between rounded-md bg-surface-high px-2 py-1.5">
                  {label}
                  <MsIcon name={ok ? "check_circle" : "pending"} size={16} className={ok ? "text-positive" : "text-negative"} />
                </li>
              ))}
            </ul>

            {note && (
              <p role="status" className="rounded-lg bg-primary/10 p-2 text-xs text-primary">
                {note}
              </p>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Button variant="buy" icon="check" disabled={selected.status === "activo"} onClick={() => setStatus(selected.id, "activo", `${selected.name} aprobado y habilitado para operar.`)}>
                Aprobar comitente
              </Button>
              <Button
                variant="secondary"
                icon="mail"
                onClick={() => {
                  setNote(`Se envió pedido de información a ${selected.email} (demo).`);
                  toast({ title: "Pedido de información enviado", text: selected.email, tone: "primary" });
                  pushAudit({ who: staffUser.fullName, role: "Compliance", action: "Pedido de información", ref: selected.account, detail: `Mail a ${selected.email}` });
                }}
              >
                Pedir información
              </Button>
              <Button variant="danger" icon="block" className="col-span-2" disabled={selected.status === "bloqueado"} onClick={() => setStatus(selected.id, "bloqueado", `${selected.name} bloqueado. Quedó registrado en el log de auditoría (demo).`)}>
                Rechazar legajo / bloquear usuario
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
