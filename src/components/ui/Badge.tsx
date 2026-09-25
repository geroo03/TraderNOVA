import type { ReactNode } from "react";

export type Tone = "neutral" | "muted" | "positive" | "negative" | "primary";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-surface-higher text-fg-muted",
  muted: "bg-surface-lowest text-fg-subtle",
  positive: "bg-positive/15 text-positive",
  negative: "bg-negative/15 text-negative",
  primary: "bg-primary/15 text-primary",
};

interface BadgeProps {
  tone?: Tone;
  pill?: boolean;
  className?: string;
  children: ReactNode;
}

export function Badge({ tone = "neutral", pill = false, className = "", children }: BadgeProps) {
  return (
    <span
      className={`text-label inline-flex items-center gap-1 whitespace-nowrap px-1.5 py-0.5 ${
        pill ? "rounded-full" : "rounded"
      } ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

const dotClasses: Record<Tone, string> = {
  neutral: "bg-fg-subtle",
  muted: "bg-fg-subtle",
  positive: "bg-positive",
  negative: "bg-negative",
  primary: "bg-primary",
};

export function StatusDot({ tone = "positive", size = 6 }: { tone?: Tone; size?: number }) {
  return (
    <span
      aria-hidden
      className={`inline-block shrink-0 rounded-full ${dotClasses[tone]}`}
      style={{ width: size, height: size }}
    />
  );
}
