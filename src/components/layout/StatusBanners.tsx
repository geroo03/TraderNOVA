"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { MsIcon } from "@/components/ui/MsIcon";
import { useMarket } from "@/components/market/MarketProvider";
import { useTrading } from "@/components/trading/TradingProvider";
import { useSettingsStore } from "@/lib/store/hooks";
import { SimBanner } from "./SimMode";

/** Avisos bajo la barra superior del inversor: simulación, cuenta restringida y mercado cerrado. */
export function StatusBanners() {
  const { simMode, setSimMode, accountRestriction } = useTrading();
  const { session } = useMarket();
  const [, setSettings] = useSettingsStore();

  return (
    <>
      <SimBanner />
      {accountRestriction && !simMode && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-2 bg-alert/15 px-4 py-2 text-xs text-negative">
          <p className="flex items-center gap-2">
            <MsIcon name="block" size={16} />
            {accountRestriction}
          </p>
          <Link href="/soporte" className="font-semibold underline">
            Ir a Soporte
          </Link>
        </div>
      )}
      {!session.open && !simMode && (
        <div role="status" className="flex flex-wrap items-center justify-between gap-2 bg-surface-high px-4 py-2 text-xs">
          <p className="flex items-center gap-2 text-fg-muted">
            <MsIcon name="schedule" size={16} />
            <span>
              <strong className="text-fg">Mercado cerrado</strong> ({session.label}). La rueda de BYMA es de lunes a viernes de 11 a 17 hs. Podés cargar órdenes límite para la próxima rueda o practicar en modo
              simulación, que opera 24/7.
            </span>
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" icon="psychology" onClick={() => setSimMode(true)}>
              Practicar en simulación
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSettings((s) => ({ ...s, sessionMode: "always" }))}>
              Abrir rueda de demostración
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
