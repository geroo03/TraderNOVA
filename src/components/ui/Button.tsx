import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { MsIcon } from "./MsIcon";
import type { MsIconName } from "./ms-icon-names";

type Variant = "primary" | "secondary" | "ghost" | "buy" | "sell" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-primary-strong text-on-primary hover:opacity-90",
  secondary: "bg-surface-higher text-fg hover:bg-surface-highest",
  ghost: "text-primary hover:bg-surface-high",
  buy: "bg-positive text-on-positive hover:opacity-90",
  sell: "bg-alert text-white hover:opacity-90",
  danger: "bg-alert/15 text-negative hover:bg-alert/25",
};

const sizes: Record<Size, string> = {
  sm: "gap-1 rounded-md px-2 py-1 text-xs",
  md: "gap-1.5 rounded-lg px-3 py-2 text-xs",
  lg: "gap-2 rounded-lg px-4 py-3 text-sm",
};

interface Common {
  variant?: Variant;
  size?: Size;
  icon?: MsIconName;
  iconRight?: MsIconName;
  children?: ReactNode;
}

function classes(variant: Variant, size: Size, extra = "") {
  return `inline-flex items-center justify-center font-semibold whitespace-nowrap transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${extra}`;
}

function Inner({ icon, iconRight, size, children }: Common) {
  const s = size === "lg" ? 18 : 16;
  return (
    <>
      {icon && <MsIcon name={icon} size={s} />}
      {children}
      {iconRight && <MsIcon name={iconRight} size={s} />}
    </>
  );
}

export function Button({ variant = "primary", size = "md", icon, iconRight, className, children, ...rest }: Common & ComponentPropsWithoutRef<"button">) {
  return (
    <button type="button" className={classes(variant, size, className)} {...rest}>
      <Inner icon={icon} iconRight={iconRight} size={size}>
        {children}
      </Inner>
    </button>
  );
}

export function ButtonLink({ variant = "primary", size = "md", icon, iconRight, className, children, href, ...rest }: Common & ComponentPropsWithoutRef<typeof Link>) {
  return (
    <Link href={href} className={classes(variant, size, className)} {...rest}>
      <Inner icon={icon} iconRight={iconRight} size={size}>
        {children}
      </Inner>
    </Link>
  );
}
