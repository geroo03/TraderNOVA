"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { StatusDot } from "@/components/ui/Badge";
import { usePopover } from "@/components/ui/usePopover";
import { useNotificationsStore, useTicketsStore } from "@/lib/store/hooks";
import { opsAlerts } from "@/lib/admin-data";
import type { ShellVariant } from "./Sidebar";

/** Campana con notificaciones: del inversor (órdenes, fondos, alertas) o del staff (tickets y alertas operativas). */
export function NotificationsMenu({ variant }: { variant: ShellVariant }) {
  const { open, setOpen, ref } = usePopover();
  const [notifications, setNotifications] = useNotificationsStore();
  const [tickets] = useTicketsStore();

  const items =
    variant === "admin"
      ? [
          ...tickets.filter((t) => t.status === "Abierto").map((t) => ({ id: t.id, title: `Ticket ${t.id} · ${t.priority}`, text: `${t.client}: ${t.subject}`, time: t.createdAt, read: false, tone: "primary" as const, href: "/admin/soporte" })),
          ...opsAlerts.filter((a) => a.severity !== "info").map((a) => ({ id: a.id, title: a.title, text: a.text, time: "Hoy", read: false, tone: a.severity === "critica" ? ("negative" as const) : ("neutral" as const), href: a.href })),
        ]
      : notifications;
  const unread = items.filter((n) => !n.read).length;

  function markAll() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  return (
    <div ref={ref} className="relative">
      <button type="button" aria-label={`Notificaciones${unread ? ` (${unread} sin leer)` : ""}`} aria-expanded={open} onClick={() => setOpen(!open)} className="relative rounded-lg p-1.5 hover:bg-surface">
        <Icon name="icon-bell" width={14} height={17} />
        {unread > 0 && (
          <span aria-hidden className="absolute -top-0.5 -right-0.5 flex min-w-4 items-center justify-center rounded-full bg-alert px-1 font-mono text-[9px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute top-full right-0 z-30 mt-2 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-surface-highest bg-surface-higher shadow-2xl">
          <div className="flex items-center justify-between border-b border-surface-highest px-3 py-2">
            <p className="text-sm font-bold">Notificaciones</p>
            {variant === "user" && unread > 0 && (
              <button type="button" onClick={markAll} className="text-label text-primary hover:underline">
                Marcar todo como leído
              </button>
            )}
          </div>
          <ul className="max-h-96 overflow-y-auto">
            {items.map((n) => (
              <li key={n.id}>
                <Link
                  href={n.href ?? "#"}
                  onClick={() => {
                    if (variant === "user") setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
                    setOpen(false);
                  }}
                  className={`flex gap-2 px-3 py-2 hover:bg-surface-highest ${n.read ? "opacity-60" : ""}`}
                >
                  <span className="pt-1.5">
                    <StatusDot tone={n.tone === "neutral" ? "neutral" : n.tone} size={7} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex justify-between gap-2">
                      <span className="truncate text-xs font-semibold">{n.title}</span>
                      <span className="text-label shrink-0 text-fg-subtle">{n.time}</span>
                    </span>
                    <span className="line-clamp-2 text-[11px] text-fg-muted">{n.text}</span>
                  </span>
                </Link>
              </li>
            ))}
            {items.length === 0 && <li className="p-6 text-center text-xs text-fg-subtle">No tenés notificaciones.</li>}
          </ul>
          {variant === "user" && (
            <Link href="/ajustes#notificaciones" onClick={() => setOpen(false)} className="block border-t border-surface-highest px-3 py-2 text-center text-xs text-primary hover:underline">
              Configurar notificaciones
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
