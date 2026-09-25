"use client";

import Link from "next/link";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { MsIcon } from "@/components/ui/MsIcon";
import { Button } from "@/components/ui/Button";
import { MoneyDialog, type MoneyAction } from "@/components/accounts/MoneyDialogs";
import { useTrading } from "@/components/trading/TradingProvider";
import { useAccountStore, useInvestor, useInvestorRestriction, useLinkedAccountsStore } from "@/lib/store/hooks";

/** Primeros pasos de una cuenta recién abierta: identidad, banco, fondos y primera operación. */
export function WelcomeChecklist() {
  const investor = useInvestor();
  const restriction = useInvestorRestriction();
  const [account, setAccount] = useAccountStore();
  const [linked] = useLinkedAccountsStore();
  const { movements, orders } = useTrading();
  const [dialog, setDialog] = useState<MoneyAction | null>(null);
  if (account.kind !== "new" || account.welcomeDismissed) return null;

  const funded = movements.some((m) => m.kind === "deposit" && m.status === "Acreditado");
  const traded = orders.some((o) => !o.simulated && o.filled > 0);
  const steps = [
    { done: !restriction, title: "Validación de identidad", text: restriction ? "En revisión: se aprueba en unos segundos (o desde la vista staff)." : "Legajo aprobado por Compliance.", action: null },
    { done: linked.length > 0, title: "Vinculá tu cuenta bancaria", text: "Para depositar y retirar, siempre a tu nombre.", action: <Button size="sm" onClick={() => setDialog("link")}>Vincular</Button> },
    { done: funded, title: "Ingresá dinero", text: "Transferí y avisanos: se acredita en segundos.", action: <Button size="sm" onClick={() => setDialog("deposit")}>Ingresar</Button> },
    { done: traded, title: "Hacé tu primera operación", text: "Comprá acciones, CEDEARs o bonos desde la boleta.", action: <Link href="/operar" className="rounded-md bg-primary-strong px-2 py-1 text-xs font-semibold text-on-primary">Operar</Link> },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <Card className="flex flex-col gap-3 border border-primary/30 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold">¡Bienvenido/a, {investor.firstName}!</h2>
          <p className="text-xs text-fg-subtle">
            Cuenta {investor.accountNumber} · {doneCount} de {steps.length} pasos completos
          </p>
        </div>
        <button type="button" aria-label="Ocultar primeros pasos" onClick={() => setAccount((a) => (a.kind === "new" ? { ...a, welcomeDismissed: true } : a))} className="rounded p-1 text-fg-subtle hover:text-fg">
          <MsIcon name="close" size={18} />
        </button>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-high" role="progressbar" aria-valuenow={doneCount} aria-valuemin={0} aria-valuemax={steps.length}>
        <div className="h-full rounded-full bg-positive transition-all" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
      </div>
      <ol className="grid gap-2 md:grid-cols-4">
        {steps.map((s, i) => (
          <li key={s.title} className={`flex flex-col gap-2 rounded-lg p-3 ${s.done ? "bg-positive/10" : "bg-surface-high"}`}>
            <p className="flex items-center gap-2 text-sm font-semibold">
              <span className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${s.done ? "bg-positive text-on-positive" : "bg-surface-higher"}`}>
                {s.done ? <MsIcon name="check" size={14} /> : i + 1}
              </span>
              {s.title}
            </p>
            <p className="text-xs text-fg-muted">{s.text}</p>
            {!s.done && s.action && <div>{s.action}</div>}
          </li>
        ))}
      </ol>
      {dialog && <MoneyDialog action={dialog} open onClose={() => setDialog(null)} />}
    </Card>
  );
}
