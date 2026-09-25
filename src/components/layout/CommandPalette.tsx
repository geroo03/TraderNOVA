"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { MsIcon } from "@/components/ui/MsIcon";
import { Icon } from "@/components/ui/Icon";
import type { MsIconName } from "@/components/ui/ms-icon-names";
import { instruments } from "@/lib/market-data";
import { useClientsStore } from "@/lib/store/hooks";
import { adminNav, userFooterNav, userNav } from "./nav-config";
import type { ShellVariant } from "./Sidebar";

interface Item {
  id: string;
  label: string;
  hint: string;
  icon: MsIconName;
  href: string;
  keywords: string;
}

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Buscador global (⌘K / Ctrl+K): especies, pantallas y, en staff, comitentes. */
export function CommandPalette({ variant }: { variant: ShellVariant }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [clients] = useClientsStore();

  const items = useMemo<Item[]>(() => {
    const nav = (variant === "admin" ? adminNav : userNav).flatMap((s) => s.items);
    const pages: Item[] = [...nav, ...(variant === "user" ? userFooterNav : [])].map((n) => ({
      id: n.href,
      label: n.label,
      hint: "Pantalla",
      icon: n.icon,
      href: n.href,
      keywords: n.label,
    }));
    if (variant === "admin") {
      return [
        ...pages,
        ...clients.map((c) => ({ id: c.id, label: c.name, hint: `Comitente ${c.account} · ${c.cuit}`, icon: "person" as const, href: `/admin/usuarios?q=${encodeURIComponent(c.name)}`, keywords: `${c.name} ${c.cuit} ${c.account} ${c.email}` })),
      ];
    }
    return [
      ...instruments.map((i) => ({ id: i.symbol, label: `${i.symbol} · ${i.name}`, hint: i.board, icon: "candlestick_chart" as const, href: `/terminal/${i.symbol}`, keywords: `${i.symbol} ${i.name} ${i.sector}` })),
      ...pages,
    ];
  }, [variant, clients]);

  const q = norm(query.trim());
  const results = (q ? items.filter((i) => norm(`${i.label} ${i.keywords}`).includes(q)) : items).slice(0, 8);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function go(item: Item | undefined) {
    if (!item) return;
    router.push(item.href);
    setOpen(false);
    setQuery("");
  }

  return (
    <div className="relative min-w-0 flex-1 lg:max-w-xs">
      <label className="flex items-center gap-3 rounded-lg bg-surface px-3 py-2">
        <Icon name="icon-search" width={14} height={14} />
        <span className="sr-only">Buscar</span>
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-controls="command-results"
          aria-autocomplete="list"
          value={query}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(results.length - 1, a + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(0, a - 1));
            } else if (e.key === "Enter") {
              e.preventDefault();
              go(results[active]);
            } else if (e.key === "Escape") {
              setOpen(false);
              inputRef.current?.blur();
            }
          }}
          placeholder={variant === "admin" ? "Buscar comitente, CUIT, pantalla…" : "Buscar especie o pantalla…"}
          className="w-full min-w-0 bg-transparent text-xs text-fg outline-none placeholder:text-fg-subtle"
        />
        <kbd className="hidden rounded bg-surface-higher px-1.5 py-0.5 text-xs text-fg-subtle lg:inline">⌘K</kbd>
      </label>
      {open && (
        <ul id="command-results" role="listbox" className="absolute top-full left-0 z-30 mt-1 w-full min-w-72 overflow-hidden rounded-xl border border-surface-highest bg-surface-higher p-1 shadow-2xl">
          {results.map((r, i) => (
            <li key={r.id} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => go(r)}
                onMouseEnter={() => setActive(i)}
                className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs ${i === active ? "bg-primary-strong/20 text-fg" : "text-fg-muted"}`}
              >
                <MsIcon name={r.icon} size={16} className="shrink-0 text-primary" />
                <span className="min-w-0 flex-1 truncate font-medium">{r.label}</span>
                <span className="text-label shrink-0 text-fg-subtle">{r.hint}</span>
              </button>
            </li>
          ))}
          {results.length === 0 && <li className="px-2 py-3 text-center text-xs text-fg-subtle">Sin resultados para “{query}”.</li>}
        </ul>
      )}
    </div>
  );
}
