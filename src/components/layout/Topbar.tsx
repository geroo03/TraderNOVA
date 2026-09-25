"use client";

import { MsIcon } from "@/components/ui/MsIcon";
import { Badge, StatusDot } from "@/components/ui/Badge";
import { Change } from "@/components/ui/Amount";
import { flashClass, useMarket } from "@/components/market/MarketProvider";
import { formatInteger } from "@/lib/format";
import { headerTicker } from "@/lib/mock-data";
import { useInvestor, useSettingsStore } from "@/lib/store/hooks";
import { CommandPalette } from "./CommandPalette";
import { MobileNav } from "./MobileNav";
import { NotificationsMenu } from "./NotificationsMenu";
import { SimModeToggle } from "./SimMode";
import { ThemeToggle, UserMenu } from "./UserMenu";
import type { ShellVariant } from "./Sidebar";

function Ticker() {
  const { quote, moves } = useMarket();
  return (
    <ul aria-label="Cotizaciones" className="hidden min-w-0 flex-1 items-center gap-4 overflow-hidden xl:flex">
      {headerTicker.map((t) => {
        // El Merval es un índice (sin feed en la demo); el resto sigue al precio en vivo.
        const live = t.symbol === "MERVAL" ? null : quote(t.symbol);
        const price = live?.price ?? t.price;
        const change = live?.changePct ?? t.changePct;
        return (
          <li key={t.symbol} className="flex shrink-0 items-center gap-1 font-mono">
            <span className="text-label uppercase text-fg-subtle">{t.symbol}</span>
            <span key={price} className={`rounded px-0.5 text-xs font-semibold ${flashClass(live ? moves[t.symbol] : 0)}`}>
              {t.symbol === "MERVAL" ? "" : "$"}
              {formatInteger(price)}
            </span>
            {change !== undefined && <Change fractionDigits={1} value={change} className="text-[11px] font-medium" />}
          </li>
        );
      })}
    </ul>
  );
}

function CurrencySwitch() {
  const [settings, setSettings] = useSettingsStore();
  const investor = useInvestor();
  return (
    <div className="hidden items-center gap-2 rounded-lg bg-surface px-2 py-1.5 sm:flex">
      <div className="text-right">
        <p className="text-label text-fg-subtle">CTA {investor.accountNumber}</p>
        <p className="text-xs font-semibold">{investor.taxCondition}</p>
      </div>
      <div role="group" aria-label="Moneda de visualización" className="flex rounded bg-surface-highest p-0.5">
        {(["ARS", "USD"] as const).map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={settings.currency === c}
            onClick={() => setSettings((s) => ({ ...s, currency: c }))}
            className={`text-label rounded px-1.5 py-0.5 ${settings.currency === c ? "bg-primary text-on-primary" : "font-medium text-fg-muted"}`}
          >
            {c}
          </button>
        ))}
      </div>
      <MsIcon name="arrow_drop_down" size={16} className="text-fg-subtle" />
    </div>
  );
}

export function Topbar({ variant = "user" }: { variant?: ShellVariant }) {
  if (variant === "admin") {
    return (
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 bg-surface-lowest/90 px-4 backdrop-blur-[6px]">
        <MobileNav variant="admin" />
        <CommandPalette variant="admin" />
        <div className="hidden flex-1 items-center gap-2 xl:flex">
          <Badge tone="positive" className="uppercase"><StatusDot /> Producción live</Badge>
          <Badge className="uppercase">FIX 4.4: <span className="text-positive">Connected</span></Badge>
          <Badge className="uppercase">CVSA: <span className="text-positive">OK</span></Badge>
        </div>
        <div className="flex items-center gap-3">
          <NotificationsMenu variant="admin" />
          <ThemeToggle />
          <UserMenu variant="admin" />
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 bg-surface-lowest/90 px-4 backdrop-blur-[6px]">
      <MobileNav variant="user" />
      <CommandPalette variant="user" />
      <Ticker />
      <div className="flex items-center gap-3">
        <SimModeToggle />
        <CurrencySwitch />
        <NotificationsMenu variant="user" />
        <ThemeToggle />
        <UserMenu variant="user" />
      </div>
    </header>
  );
}
