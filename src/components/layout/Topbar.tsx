"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Change } from "@/components/ui/Amount";
import { formatInteger } from "@/lib/format";
import { currentUser, headerTicker } from "@/lib/mock-data";
import type { Currency } from "@/lib/types";

export function Topbar() {
  const [currency, setCurrency] = useState<Currency>("ARS");

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 bg-surface-lowest/90 px-4 backdrop-blur-[6px]">
      <label className="flex min-w-0 flex-1 items-center gap-4 rounded-lg bg-surface px-3 py-2 lg:max-w-[152px]">
        <Icon name="icon-search" width={14} height={14} />
        <span className="sr-only">Buscar</span>
        {/* TODO: conectar a una paleta de comandos (⌘K). */}
        <input type="search" placeholder="Buscar" className="w-full min-w-0 bg-transparent text-xs text-fg outline-none placeholder:text-fg-subtle lg:w-0" />
        <kbd className="hidden rounded bg-surface-higher px-1.5 py-0.5 text-xs text-fg-subtle lg:inline">⌘K</kbd>
      </label>

      <ul aria-label="Cotizaciones" className="hidden min-w-0 flex-1 items-center gap-4 overflow-hidden xl:flex">
        {headerTicker.map((q) => (
          <li key={q.symbol} className="flex shrink-0 items-center gap-1 font-mono">
            <span className="text-label uppercase text-fg-subtle">{q.symbol}</span>
            <span className="text-xs font-semibold">
              {q.symbol === "MERVAL" ? "" : "$"}
              {formatInteger(q.price)}
            </span>
            {q.changePct !== undefined && <Change fractionDigits={1} value={q.changePct} className="text-[11px] font-medium" />}
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-lg bg-surface px-2 py-1.5 sm:flex">
          <div className="text-right">
            <p className="text-label text-fg-subtle">CTA {currentUser.accountNumber}</p>
            <p className="text-xs font-semibold">{currentUser.taxCondition}</p>
          </div>
          <div role="group" aria-label="Moneda de visualización" className="flex rounded bg-surface-highest p-0.5">
            {(["ARS", "USD"] as const).map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={currency === c}
                onClick={() => setCurrency(c)}
                className={`text-label rounded px-1.5 py-0.5 ${
                  currency === c ? "bg-primary text-on-primary" : "font-medium text-fg-muted"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <Icon name="icon-chevron-down" width={8} height={4} />
        </div>

        <button type="button" aria-label="Notificaciones" className="relative rounded-lg p-1.5 hover:bg-surface">
          <Icon name="icon-bell" width={14} height={17} />
          <span aria-hidden className="absolute top-1 right-1 size-2 rounded-full bg-alert" />
        </button>
        <button type="button" aria-label="Cambiar tema" className="rounded-lg p-1.5 hover:bg-surface">
          <Icon name="icon-moon" width={15} height={15} />
        </button>

        <div className="flex items-center gap-2 pl-1">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary">
            <Icon name="icon-user" width={12} height={12} />
          </span>
          <div className="hidden md:block">
            <p className="flex items-center gap-1 text-xs font-semibold">
              {currentUser.fullName}
              {currentUser.verified && <Icon name="icon-verified" width={13} height={13} label="Cuenta verificada" />}
            </p>
            <p className="text-label text-fg-subtle">Verificada CNV</p>
          </div>
        </div>
      </div>
    </header>
  );
}
