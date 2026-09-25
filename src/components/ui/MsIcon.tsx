import type { CSSProperties } from "react";
import type { MsIconName } from "./ms-icon-names";

interface MsIconProps {
  name: MsIconName;
  size?: number;
  className?: string;
  label?: string;
}

/**
 * Material Symbols (outlined) renderizado con máscara CSS: toma el color del
 * texto (`text-*`), así un mismo SVG sirve para todos los estados y tonos.
 * Los archivos viven en public/icons (ver scripts/sync-icons.mjs).
 */
export function MsIcon({ name, size = 16, className = "", label }: MsIconProps) {
  const url = `url(/icons/${name}.svg)`;
  const style: CSSProperties = {
    width: size,
    height: size,
    maskImage: url,
    WebkitMaskImage: url,
    maskSize: "contain",
    WebkitMaskSize: "contain",
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
    maskPosition: "center",
    WebkitMaskPosition: "center",
  };
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`inline-block shrink-0 bg-current ${className}`}
      style={style}
    />
  );
}
