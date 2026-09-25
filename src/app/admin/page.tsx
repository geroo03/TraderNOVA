import type { Metadata } from "next";
import Link from "next/link";
import { BarChart } from "@/components/charts/BarChart";
import { LineChart } from "@/components/charts/LineChart";
import { DeskActivity } from "@/components/admin/DeskActivity";
import { Badge, StatusDot, type Tone } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { MsIcon } from "@/components/ui/MsIcon";
import { PageHeader, Panel, Stat } from "@/components/ui/Page";
import { formatDecimal, formatInteger } from "@/lib/format";
import { adminKpis as k, hourlyVolume, opsAlerts, registrations, type Severity } from "@/lib/admin-data";

export const metadata: Metadata = { title: "Consola de control" };

const sevTone: Record<Severity, Tone> = { critica: "negative", media: "primary", baja: "neutral", info: "positive" };

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow={
          <>
            <Badge tone="primary">ALyC 942</Badge>
            <Badge tone="positive" className="uppercase"><StatusDot /> Rueda BYMA en curso</Badge>
            <span className="text-label text-fg-subtle">FIX: BYMA_01_PROD (3ms)</span>
          </>
        }
        title="Consola de Control y Operaciones Staff"
        description="Monitoreo en tiempo real de comitentes, órdenes DMA BYMA, flujos de tesorería y alertas regulatorias CNV/UIF."
        actions={
          <>
            <Button variant="secondary" icon="refresh">Refrescar DMA</Button>
            <ButtonLink href="/admin/cumplimiento" icon="download">Exportar reporte CNV</ButtonLink>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Comitentes activos" value={formatInteger(k.activeClients)} badge={<Badge tone="positive">+{formatDecimal(k.activeClientsChangePct)}%</Badge>} hint={`${formatInteger(k.connectedNow)} conectados en rueda`} />
        <Stat label="Nuevas cuentas (mes)" value={formatInteger(k.newAccountsMonth)} badge={<Badge tone="primary">SLA 98%</Badge>} hint={`+${k.newAccountsToday} hoy · 85% aprobación automática`} />
        <Stat label="Volumen operado hoy" value={<span className="text-lg">${formatInteger(k.volumeToday)}</span>} badge={<Badge tone="positive">+{k.volumeVsYesterdayPct}% vs ayer</Badge>} hint="BYMA acciones & CEDEARs 61,2%" />
        <Stat label="Fondos bajo custodia" value={`$${formatInteger(k.aucM)}M`} badge={<Badge>AUC</Badge>} hint={`+$${formatInteger(k.aucTodayM)}M hoy · Caja de Valores`} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel
          title="Registros y altas de comitentes"
          subtitle="Últimos 14 días de onboarding"
          actions={
            <span className="flex gap-3 text-[11px] text-fg-subtle">
              <span className="flex items-center gap-1"><span className="size-2 rounded-sm bg-primary-strong" /> Verificados</span>
              <span className="flex items-center gap-1"><span className="size-2 rounded-sm bg-negative" /> Pendientes</span>
            </span>
          }
        >
          <BarChart data={registrations} colors={["var(--color-primary-strong)", "var(--color-negative)"]} className="h-44" label="Altas diarias de comitentes, verificadas y pendientes" />
          <dl className="grid grid-cols-3 gap-2 pt-3 text-xs">
            <div><dt className="text-label text-fg-subtle">Ritmo</dt><dd className="font-mono">89 / día</dd></div>
            <div><dt className="text-label text-fg-subtle">Aprobación auto.</dt><dd className="font-mono text-positive">91,4%</dd></div>
            <div><dt className="text-label text-fg-subtle">Rechazo</dt><dd className="font-mono text-negative">1,6%</dd></div>
          </dl>
        </Panel>
        <Panel
          title="Distribución horaria BYMA"
          subtitle="Volumen operado por franja (ARS M)"
          actions={
            <span className="flex gap-3 text-[11px] text-fg-subtle">
              <span className="flex items-center gap-1"><span className="size-2 rounded-sm bg-primary-strong" /> Acciones / CEDEAR</span>
              <span className="flex items-center gap-1"><span className="size-2 rounded-sm bg-positive" /> Bonos</span>
            </span>
          }
        >
          <div className="h-44">
            <LineChart
              label="Volumen horario de acciones y bonos"
              gridLines={3}
              series={[
                { values: hourlyVolume.equities, color: "var(--color-primary-strong)", area: true },
                { values: hourlyVolume.bonds, color: "var(--color-positive)", area: true },
              ]}
            />
          </div>
          <div className="flex justify-between pt-1 font-mono text-[10px] text-fg-subtle">
            {hourlyVolume.labels.map((l) => (
              <span key={l}>{l}</span>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <Panel title={<><MsIcon name="notifications_active" size={18} className="text-negative" /> Supervisión operativa & alertas</>} actions={<Badge tone="negative">{opsAlerts.filter((a) => a.severity !== "info").length} pendientes</Badge>}>
          <ul className="flex flex-col gap-2">
            {opsAlerts.map((a) => (
              <li key={a.id} className="flex flex-col gap-2 rounded-lg bg-surface-high p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <StatusDot tone={sevTone[a.severity]} size={8} /> {a.title}
                  </p>
                  <Badge tone={sevTone[a.severity]} className="uppercase">{a.tag}</Badge>
                </div>
                <p className="text-xs text-fg-subtle">{a.text}</p>
                <Link href={a.href} className="self-end text-xs font-semibold text-primary hover:underline">
                  {a.action} →
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Actividad reciente en mesa de operaciones" subtitle="Eventos en tiempo real de todos los canales" className="min-w-0">
          <DeskActivity />
          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 text-xs text-fg-subtle">
            <span>Mostrando 5 de 1.489 eventos hoy · Tasa de fill DMA: <span className="text-positive">99,8%</span></span>
            <Link href="/admin/ordenes" className="font-semibold text-primary hover:underline">Ver libro completo de órdenes →</Link>
          </div>
        </Panel>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["CNV", "Registro oficial ALyC Nº 942 activo"],
          ["UIF", "Sujeto obligado · reportes al día"],
          ["BYMA market data", "Online · latencia 4,12 ms"],
          ["COELSA / SNP", "Online · conciliación automática"],
        ].map(([k2, v]) => (
          <p key={k2} className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2 text-xs">
            <StatusDot /> <span className="font-semibold">{k2}</span> <span className="text-fg-subtle">{v}</span>
          </p>
        ))}
      </div>
    </div>
  );
}
