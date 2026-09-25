import Image from "next/image";

/** Nombres de los SVG exportados desde Figma en public/figma. */
export type IconName =
  | "login-logo-mark" | "icon-mail" | "icon-lock" | "icon-eye" | "icon-arrow-right"
  | "icon-shield-2fa" | "icon-legal" | "icon-trend-up-small" | "login-merval-chart"
  | "icon-shield-check" | "icon-shield-footer" | "kpi-trend-up" | "kpi-sparkline-1"
  | "kpi-arrow-up" | "kpi-sparkline-2" | "kpi-mtd" | "kpi-sparkline-3" | "icon-plus-circle"
  | "icon-exchange" | "performance-chart" | "icon-pie" | "donut-allocation" | "icon-bolt"
  | "icon-arrow-right-sm" | "icon-sparkles" | "icon-check-circle" | "icon-arrow-right-dark"
  | "icon-wallet" | "icon-receipt" | "icon-arrow-right-link" | "icon-lock-small"
  | "icon-search" | "icon-chevron-down" | "icon-bell" | "icon-moon" | "icon-user"
  | "icon-verified" | "nav-quotes" | "nav-holdings" | "nav-trade" | "nav-orders"
  | "nav-accounts" | "nav-analytics" | "nav-settings" | "nav-support" | "nav-collapse";

interface IconProps {
  name: IconName;
  width: number;
  height: number;
  className?: string;
  /** Solo si el ícono transmite información por sí mismo; si no, queda decorativo. */
  label?: string;
}

export function Icon({ name, width, height, className, label }: IconProps) {
  return (
    <Image
      src={`/figma/${name}.svg`}
      width={width}
      height={height}
      alt={label ?? ""}
      aria-hidden={label ? undefined : true}
      className={`shrink-0 ${className ?? ""}`}
    />
  );
}
