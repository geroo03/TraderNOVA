"use client";

import { Badge, StatusDot } from "@/components/ui/Badge";
import { useMarketSession } from "./useSession";

/** Estado de la rueda BYMA (abierta/cerrada) para encabezados; funciona en ambos shells. */
export function SessionBadge({ openText = "Mercado abierto BYMA", className = "" }: { openText?: string; className?: string }) {
  const s = useMarketSession();
  if (s.open)
    return (
      <Badge tone="positive" className={`uppercase ${className}`}>
        <StatusDot /> {openText}
        {s.forced ? " · demo" : s.label ? ` · ${s.label}` : ""}
      </Badge>
    );
  return (
    <Badge tone="neutral" className={`uppercase ${className}`}>
      <StatusDot tone="neutral" /> Mercado cerrado · {s.label}
    </Badge>
  );
}
