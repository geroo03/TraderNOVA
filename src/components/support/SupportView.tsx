"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Field, fieldCls } from "@/components/ui/Dialog";
import { MsIcon } from "@/components/ui/MsIcon";
import { Panel } from "@/components/ui/Page";
import { useToast } from "@/components/ui/Toast";
import { currentUser } from "@/lib/mock-data";
import { newId, nowTime } from "@/lib/download";
import { useSettingsStore, useTicketsStore } from "@/lib/store/hooks";
import type { Ticket } from "@/lib/store/demo-data";
import { TicketThread } from "./TicketThread";

const FAQ = [
  { q: "¿Cuánto tarda en acreditarse una transferencia?", a: "Las transferencias desde cuentas a tu nombre se acreditan en segundos vía COELSA, las 24 horas. Si no la ves, avisanos desde Cuentas y Fondos." },
  { q: "¿Qué comisiones cobra Nodo?", a: "0,15% + IVA por operación en acciones y CEDEARs, más derechos de mercado BYMA (0,08%). Sin costo de mantenimiento ni de custodia." },
  { q: "¿Cómo compro dólar MEP?", a: "Desde Cuentas y Fondos o el dashboard, con “Comprar dólar MEP”. Compramos AL30 en pesos y vendemos AL30D respetando el parking." },
  { q: "¿Qué es el modo simulación?", a: "Te da un saldo virtual para practicar con precios reales del feed. Las órdenes simuladas no llegan al mercado y no se mezclan con las reales." },
  { q: "¿Cómo funcionan el stop loss y el take profit?", a: "Los definís en la boleta al comprar. Cuando la entrada se ejecuta, el sistema vende automáticamente si el precio toca el stop o el target." },
  { q: "¿Mis activos están seguros?", a: "Tus títulos están en Caja de Valores S.A. a tu nombre y CUIT, fuera del balance de Nodo. Somos ALyC Nº 942 registrado ante CNV." },
  { q: "¿Cómo retiro mis fondos?", a: "Desde Cuentas y Fondos → Retirar. Llegan en menos de 10 minutos en horario bancario a tus cuentas declaradas." },
];

/** Respuestas del asistente Nova por palabras clave (demo sin IA real). */
const BOT: { match: RegExp; text: string }[] = [
  { match: /mep|d[oó]lar/i, text: "Podés comprar dólar MEP desde Cuentas y Fondos. Hoy la cotización es $1.285,40 y se liquida en T+1." },
  { match: /comisi|costo|arancel/i, text: "La comisión es 0,15% + IVA, más derechos BYMA de 0,08%. En la boleta ves el desglose exacto antes de enviar." },
  { match: /retir|transfer|extrac/i, text: "Los retiros a cuentas propias no tienen costo y llegan en menos de 10 minutos. Lo hacés desde Cuentas y Fondos → Retirar." },
  { match: /stop|target|take profit/i, text: "Activá “Stop loss y take profit” en la boleta de compra. También podés arrastrar las líneas en el gráfico." },
  { match: /simula/i, text: "El interruptor “Simulación” de la barra superior te da $10.000.000 virtuales para practicar sin riesgo." },
  { match: /deposit|ingres|acredit/i, text: "Transferí a la CBU de Nodo desde una cuenta a tu nombre y avisanos en Cuentas y Fondos: se acredita en segundos." },
];

interface ChatMsg {
  from: "user" | "bot";
  text: string;
}

function NovaChat({ onEscalate }: { onEscalate: (text: string) => void }) {
  const [msgs, setMsgs] = useState<ChatMsg[]>([{ from: "bot", text: "¡Hola! Soy Nova, tu asistente. Preguntame sobre depósitos, dólar MEP, comisiones, stops o el modo simulación." }]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);

  function send() {
    const t = text.trim();
    if (!t) return;
    setMsgs((m) => [...m, { from: "user", text: t }]);
    setText("");
    setTyping(true);
    setTimeout(() => {
      const hit = BOT.find((b) => b.match.test(t));
      setMsgs((m) => [...m, { from: "bot", text: hit?.text ?? "No tengo una respuesta para eso. ¿Querés que lo derive a un asesor humano? Tocá “Hablar con un asesor”." }]);
      setTyping(false);
    }, 700);
  }

  const lastUser = [...msgs].reverse().find((m) => m.from === "user");

  return (
    <div className="flex h-96 flex-col">
      <ul aria-live="polite" className="flex flex-1 flex-col gap-2 overflow-y-auto pr-1">
        {msgs.map((m, i) => (
          <li key={i} className={`max-w-[85%] rounded-xl px-3 py-2 text-xs ${m.from === "user" ? "self-end bg-primary-strong text-on-primary" : "self-start bg-surface-high"}`}>
            {m.text}
          </li>
        ))}
        {typing && <li className="self-start rounded-xl bg-surface-high px-3 py-2 text-xs text-fg-subtle">Nova está escribiendo…</li>}
      </ul>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex gap-2 pt-2"
      >
        <label htmlFor="nova-input" className="sr-only">
          Mensaje para Nova
        </label>
        <input id="nova-input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Escribí tu consulta…" className={fieldCls} />
        <Button type="submit" icon="send" disabled={!text.trim()} aria-label="Enviar" />
      </form>
      <button type="button" disabled={!lastUser} onClick={() => lastUser && onEscalate(lastUser.text)} className="text-label self-start pt-2 text-primary hover:underline disabled:opacity-40">
        Hablar con un asesor (crea un ticket)
      </button>
    </div>
  );
}

export function SupportView() {
  const toast = useToast();
  const [tickets, setTickets] = useTicketsStore();
  const [settings] = useSettingsStore();
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({ subject: "", category: "Operatoria", priority: "Media" as Ticket["priority"], text: "" });
  const [openId, setOpenId] = useState<string | null>(null);
  const me = settings.profile.fullName;
  const mine = tickets.filter((t) => t.account === currentUser.accountNumber);
  const q = query.trim().toLowerCase();
  const faq = FAQ.filter((f) => !q || `${f.q} ${f.a}`.toLowerCase().includes(q));

  function create(subject: string, text: string, category = form.category, priority = form.priority) {
    const t: Ticket = {
      id: newId("TK"),
      subject,
      category,
      priority,
      status: "Abierto",
      client: me,
      account: currentUser.accountNumber,
      createdAt: `Hoy ${nowTime().slice(0, 5)}`,
      messages: [{ from: "cliente", author: me, text, time: nowTime().slice(0, 5) }],
    };
    setTickets((prev) => [t, ...prev]);
    setOpenId(t.id);
    toast({ title: `Ticket ${t.id} creado`, text: "Te respondemos en menos de 15 minutos (lo ves también desde la vista staff)." });
  }

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="flex min-w-0 flex-col gap-4">
        <Panel
          title="Preguntas frecuentes"
          actions={
            <label className="flex items-center gap-2 rounded-lg bg-surface-high px-3 py-1.5">
              <MsIcon name="search" size={16} className="text-fg-subtle" />
              <span className="sr-only">Buscar en la ayuda</span>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar en la ayuda…" className="w-40 bg-transparent text-xs outline-none" />
            </label>
          }
        >
          <div className="flex flex-col gap-1">
            {faq.map((f) => (
              <details key={f.q} className="group rounded-lg bg-surface-high p-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-semibold">
                  {f.q}
                  <MsIcon name="keyboard_arrow_down" size={18} className="shrink-0 text-fg-subtle transition-transform group-open:rotate-180" />
                </summary>
                <p className="pt-2 text-xs text-fg-muted">{f.a}</p>
              </details>
            ))}
            {faq.length === 0 && <p className="p-4 text-center text-xs text-fg-subtle">Sin resultados. Probá con el asistente o abrí un ticket.</p>}
          </div>
        </Panel>

        <Panel title="Mis consultas" actions={<Badge>{mine.length}</Badge>}>
          <ul className="flex flex-col gap-2">
            {mine.map((t) => (
              <li key={t.id} className="rounded-lg bg-surface-high">
                <button type="button" onClick={() => setOpenId(openId === t.id ? null : t.id)} className="flex w-full items-center justify-between gap-2 p-3 text-left">
                  <span>
                    <span className="block text-sm font-semibold">{t.subject}</span>
                    <span className="font-mono text-[10px] text-fg-subtle">
                      {t.id} · {t.category} · {t.createdAt}
                    </span>
                  </span>
                  <Badge tone={t.status === "Resuelto" ? "positive" : t.status === "En curso" ? "primary" : "neutral"} pill>
                    {t.status}
                  </Badge>
                </button>
                {openId === t.id && (
                  <div className="border-t border-surface-higher p-3">
                    <TicketThread ticket={t} as="cliente" author={me} />
                  </div>
                )}
              </li>
            ))}
            {mine.length === 0 && <li className="text-xs text-fg-subtle">Todavía no abriste consultas.</li>}
          </ul>
        </Panel>
      </div>

      <div className="flex flex-col gap-4">
        <Panel title={<><MsIcon name="star_shine" size={18} className="text-primary" /> Asistente Nova</>} actions={<Badge tone="positive">24/7</Badge>}>
          <NovaChat onEscalate={(text) => create("Consulta derivada del asistente", text, "Asistente", "Media")} />
        </Panel>
        <Panel title="Nueva consulta" subtitle="Un asesor te responde en menos de 15 minutos en horario de rueda">
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (form.subject.trim().length < 4 || form.text.trim().length < 10) return;
              create(form.subject.trim(), form.text.trim());
              setForm({ ...form, subject: "", text: "" });
            }}
          >
            <Field label="Asunto">
              <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className={fieldCls} placeholder="Ej: No veo mi depósito" />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Categoría">
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={fieldCls}>
                  {["Operatoria", "Fondos", "Cuenta", "Impuestos", "Otro"].map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Prioridad">
                <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Ticket["priority"] })} className={fieldCls}>
                  {["Baja", "Media", "Alta"].map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Detalle" hint="Mínimo 10 caracteres">
              <textarea rows={4} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} className={fieldCls} />
            </Field>
            <Button type="submit" icon="send" disabled={form.subject.trim().length < 4 || form.text.trim().length < 10}>
              Enviar consulta
            </Button>
          </form>
        </Panel>
      </div>
    </div>
  );
}
