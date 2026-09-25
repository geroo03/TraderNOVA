import type { ReactNode } from "react";
import { Card } from "./Card";

interface PageHeaderProps {
  eyebrow?: ReactNode;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex max-w-2xl flex-col gap-1">
        {eyebrow && <div className="flex flex-wrap items-center gap-2">{eyebrow}</div>}
        <h1 className="text-2xl font-bold tracking-[-0.6px] sm:text-[28px]">{title}</h1>
        {description && <p className="text-sm text-fg-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

interface PanelProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}

/** Card con encabezado estándar (título + acciones), la unidad básica de todas las pantallas. */
export function Panel({ title, subtitle, actions, className = "", bodyClassName = "", children }: PanelProps) {
  return (
    <Card className={`flex flex-col gap-3 p-4 ${className}`}>
      {(title || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            {title && <h2 className="flex items-center gap-2 text-base font-bold">{title}</h2>}
            {subtitle && <p className="text-xs text-fg-subtle">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </Card>
  );
}

interface StatProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  badge?: ReactNode;
  className?: string;
}

export function Stat({ label, value, hint, badge, className = "" }: StatProps) {
  return (
    <Card className={`flex flex-col gap-1 p-3 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-label uppercase text-fg-subtle">{label}</span>
        {badge}
      </div>
      <div className="font-mono text-xl font-semibold tracking-[-0.5px]">{value}</div>
      {hint && <div className="text-xs text-fg-subtle">{hint}</div>}
    </Card>
  );
}

/** Clases compartidas para tablas de datos. */
export const table = {
  wrap: "relative overflow-x-auto",
  table: "w-full border-separate border-spacing-0 text-left",
  th: "text-label whitespace-nowrap bg-surface-high px-3 py-2.5 uppercase text-fg-subtle first:rounded-l-lg last:rounded-r-lg",
  td: "whitespace-nowrap px-3 py-2.5 text-xs",
  row: "transition-colors hover:bg-surface-high/40",
};
