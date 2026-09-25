"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { MsIcon } from "@/components/ui/MsIcon";
import { Badge, StatusDot } from "@/components/ui/Badge";
import { Change } from "@/components/ui/Amount";
import { formatInteger } from "@/lib/format";
import { currentUser, headerTicker, staffUser } from "@/lib/mock-data";
import type { Currency } from "@/lib/types";
import { MobileNav } from "./MobileNav";
import type { ShellVariant } from "./Sidebar";

function Search({ placeholder }: { placeholder: string }) {
  return (
    <label className="flex min-w-0 flex-1 items-center gap-3 rounded-lg bg-surface px-3 py-2 lg:max-w-xs">
      <Icon name="icon-search" width={14} height={14} />
      <span className="sr-only">Buscar</span>
      <input type="search" placeholder={placeholder} className="w-full min-w-0 bg-transparent text-xs text-fg outline-none placeholder:text-fg-subtle" />
      <kbd className="hidden rounded bg-surface-higher px-1.5 py-0.5 text-xs text-fg-subtle lg:inline">⌘K</kbd>
    </label>
  );
}

function Avatar({ initials }: { initials?: string }) {
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-on-primary">
      {initials ?? <Icon name="icon-user" width={12} height={12} />}
    </span>
  );
}

function IconButtons() {
  return (
    <>
      <button type="button" aria-label="Notificaciones" className="relative rounded-lg p-1.5 hover:bg-surface">
        <Icon name="icon-bell" width={14} height={17} />
        <span aria-hidden className="absolute top-1 right-1 size-2 rounded-full bg-alert" />
      </button>
      <button type="button" aria-label="Cambiar tema" className="hidden rounded-lg p-1.5 hover:bg-surface sm:block">
        <Icon name="icon-moon" width={15} height={15} />
      </button>
    </>
  );
}

export function Topbar({ variant = "user" }: { variant?: ShellVariant }) {
  const [currency, setCurrency] = useState<Currency>("ARS");

  if (variant === "admin") {
    return (
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 bg-surface-lowest/90 px-4 backdrop-blur-[6px]">
        <MobileNav variant="admin" />
        <Search placeholder="Buscar comitente, CUIT, orden…" />
        <div className="hidden flex-1 items-center gap-2 xl:flex">
          <Badge tone="positive" className="uppercase"><StatusDot /> Producción live</Badge>
          <Badge className="uppercase">FIX 4.4: <span className="text-positive">Connected</span></Badge>
          <Badge className="uppercase">CVSA: <span className="text-positive">OK</span></Badge>
        </div>
        <div className="flex items-center gap-3">
          <IconButtons />
          <div className="flex items-center gap-2 pl-1">
            <div className="hidden text-right md:block">
              <p className="text-xs font-semibold">{staffUser.fullName}</p>
              <p className="text-label text-fg-subtle">{staffUser.role}</p>
            </div>
            <Avatar initials={staffUser.initials} />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 bg-surface-lowest/90 px-4 backdrop-blur-[6px]">
      <MobileNav variant="user" />
      <Search placeholder="Buscar especie…" />

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
                className={`text-label rounded px-1.5 py-0.5 ${currency === c ? "bg-primary text-on-primary" : "font-medium text-fg-muted"}`}
              >
                {c}
              </button>
            ))}
          </div>
          <MsIcon name="arrow_drop_down" size={16} className="text-fg-subtle" />
        </div>
        <IconButtons />
        <div className="flex items-center gap-2 pl-1">
          <Avatar />
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
