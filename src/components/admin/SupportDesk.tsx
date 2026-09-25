"use client";

import { useState } from "react";
import { Badge, StatusDot, type Tone } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { MsIcon } from "@/components/ui/MsIcon";
import { Panel, Stat } from "@/components/ui/Page";
import { Tabs } from "@/components/ui/Tabs";
import { fieldCls } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";
import { TicketThread } from "@/components/support/TicketThread";
import { staffUser } from "@/lib/mock-data";
import { pushAudit, pushNotification, useTicketsStore } from "@/lib/store/hooks";
import type { TicketStatus } from "@/lib/store/demo-data";

const prioTone: Record<string, Tone> = { Alta: "negative", Media: "primary", Baja: "neutral" };
const statusTone: Record<TicketStatus, Tone> = { Abierto: "negative", "En curso": "primary", Resuelto: "positive" };
const TEMPLATES = [
  "Hola, gracias por escribirnos. Ya estamos revisando tu caso.",
  "Tu transferencia ya fue conciliada y el saldo está disponible.",
  "La comisión es 0,15% + IVA más derechos de mercado BYMA (0,08%).",
];

/** Mesa de ayuda: cola de tickets con respuesta, estado y plantillas. */
export function SupportDesk() {
  const toast = useToast();
  const [tickets, setTickets] = useTicketsStore();
  const [filter, setFilter] = useState<"all" | TicketStatus>("Abierto");
  const [picked, setPicked] = useState<string | null>(null);
  const rows = tickets.filter((t) => filter === "all" || t.status === filter);
  const selected = tickets.find((t) => t.id === (picked ?? rows[0]?.id));
  const count = (s: TicketStatus) => tickets.filter((t) => t.status === s).length;

  function setStatus(status: TicketStatus) {
    if (!selected) return;
    setTickets((prev) => prev.map((t) => (t.id === selected.id ? { ...t, status } : t)));
    pushAudit({ who: staffUser.fullName, role: "Soporte", action: `Ticket ${status.toLowerCase()}`, ref: selected.id, detail: `${selected.client}: ${selected.subject}` });
    if (status === "Resuelto") pushNotification({ title: `Consulta ${selected.id} resuelta`, text: selected.subject, tone: "positive", href: "/soporte" });
    toast({ title: `Ticket ${selected.id}: ${status}`, tone: "neutral" });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Abiertos" value={<span className="text-negative">{count("Abierto")}</span>} badge={<Badge tone="negative">SLA 15m</Badge>} />
        <Stat label="En curso" value={count("En curso")} />
        <Stat label="Resueltos" value={<span className="text-positive">{count("Resuelto")}</span>} />
        <Stat label="Satisfacción (CSAT)" value="4,8 / 5" hint="Últimos 30 días" />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <Panel title="Cola de tickets">
          <div className="flex flex-col gap-3">
            <Tabs
              label="Estado"
              value={filter}
              onChange={(v) => {
                setFilter(v);
                setPicked(null);
              }}
              items={[
                { id: "Abierto", label: "Abiertos", count: count("Abierto") },
                { id: "En curso", label: "En curso", count: count("En curso") },
                { id: "Resuelto", label: "Resueltos", count: count("Resuelto") },
                { id: "all", label: "Todos", count: tickets.length },
              ]}
            />
            <ul className="flex flex-col gap-1.5">
              {rows.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setPicked(t.id)}
                    className={`flex w-full flex-col gap-1 rounded-lg p-3 text-left ${selected?.id === t.id ? "bg-primary-strong/15 ring-1 ring-primary" : "bg-surface-high hover:bg-surface-higher"}`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold">{t.subject}</span>
                      <Badge tone={prioTone[t.priority]}>{t.priority}</Badge>
                    </span>
                    <span className="font-mono text-[10px] text-fg-subtle">
                      {t.id} · {t.client} · {t.createdAt}
                    </span>
                  </button>
                </li>
              ))}
              {rows.length === 0 && <li className="p-4 text-center text-xs text-fg-subtle">Sin tickets en este estado.</li>}
            </ul>
          </div>
        </Panel>

        {selected ? (
          <Card className="flex flex-col gap-3 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-label text-fg-subtle">
                  {selected.id} · {selected.category}
                </p>
                <h2 className="text-lg font-bold">{selected.subject}</h2>
                <p className="text-xs text-fg-subtle">
                  {selected.client} · Cta. {selected.account}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={statusTone[selected.status]} pill>
                  <StatusDot tone={statusTone[selected.status]} /> {selected.status}
                </Badge>
                <label className="sr-only" htmlFor="ticket-status">
                  Cambiar estado
                </label>
                <select id="ticket-status" value={selected.status} onChange={(e) => setStatus(e.target.value as TicketStatus)} className={`${fieldCls} w-32 py-1 text-xs`}>
                  <option>Abierto</option>
                  <option>En curso</option>
                  <option>Resuelto</option>
                </select>
              </div>
            </div>
            <TicketThread ticket={selected} as="staff" author={`${staffUser.fullName} (Nodo)`} />
            <div>
              <p className="text-label flex items-center gap-1 pb-1 uppercase text-fg-subtle">
                <MsIcon name="content_copy" size={12} /> Respuestas rápidas
              </p>
              <div className="flex flex-wrap gap-1">
                {TEMPLATES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      void navigator.clipboard?.writeText(t).catch(() => {});
                      toast({ title: "Plantilla copiada", text: "Pegala en la respuesta.", tone: "neutral" });
                    }}
                    className="rounded-lg bg-surface-high px-2 py-1 text-left text-[11px] text-fg-muted hover:text-fg"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        ) : (
          <Card className="flex items-center justify-center p-8 text-sm text-fg-subtle">Seleccioná un ticket.</Card>
        )}
      </div>
    </div>
  );
}
