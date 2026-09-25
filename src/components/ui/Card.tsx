import type { ComponentPropsWithoutRef } from "react";

export function Card({ className = "", ...props }: ComponentPropsWithoutRef<"section">) {
  return <section className={`rounded-xl bg-surface shadow-card ${className}`} {...props} />;
}
