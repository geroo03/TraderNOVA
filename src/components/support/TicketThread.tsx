"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { fieldCls } from "@/components/ui/Dialog";
import { useToast } from "@/components/ui/Toast";
import { nowTime } from "@/lib/download";
import { useTicketsStore } from "@/lib/store/hooks";
import type { Ticket } from "@/lib/store/demo-data";

/** Conversación de un ticket con caja de respuesta; la usan cliente y staff sobre el mismo estado. */
export function TicketThread({ ticket, as, author }: { ticket: Ticket; as: "cliente" | "staff"; author: string }) {
  const toast = useToast();
  const [, setTickets] = useTicketsStore();
  const [text, setText] = useState("");

  function reply() {
    const t = text.trim();
    if (!t) return;
    setTickets((prev) =>
      prev.map((x) =>
        x.id === ticket.id
          ? { ...x, status: as === "staff" && x.status === "Abierto" ? "En curso" : as === "cliente" && x.status === "Resuelto" ? "Abierto" : x.status, messages: [...x.messages, { from: as, author, text: t, time: nowTime().slice(0, 5) }] }
          : x,
      ),
    );
    setText("");
    toast({ title: "Respuesta enviada", text: ticket.id, tone: "neutral" });
  }

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-2">
        {ticket.messages.map((m, i) => {
          const mine = m.from === as;
          return (
            <li key={i} className={`max-w-[85%] rounded-xl px-3 py-2 text-xs ${mine ? "self-end bg-primary-strong/20" : "self-start bg-surface-higher"}`}>
              <p className="text-label pb-0.5 text-fg-subtle">
                {m.author} · {m.time}
              </p>
              {m.text}
            </li>
          );
        })}
      </ul>
      <div className="flex gap-2">
        <label htmlFor={`reply-${ticket.id}`} className="sr-only">
          Responder
        </label>
        <input
          id={`reply-${ticket.id}`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && reply()}
          placeholder={as === "staff" ? "Responder al comitente…" : "Agregar un mensaje…"}
          className={fieldCls}
        />
        <Button icon="send" disabled={!text.trim()} onClick={reply} aria-label="Enviar respuesta" />
      </div>
    </div>
  );
}
