"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MsIcon } from "@/components/ui/MsIcon";
import { Badge } from "@/components/ui/Badge";
import { isActive, type NavItem, type NavSection } from "./nav-config";

interface SidebarNavProps {
  sections: NavSection[];
  onNavigate?: () => void;
}

export function SidebarNav({ sections, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  return (
    <div className="flex flex-col gap-3">
      {sections.map((section) => (
        <div key={section.title}>
          <p className="text-label px-5 pt-4 pb-1 uppercase text-fg-subtle">{section.title}</p>
          <nav aria-label={section.title} className="flex flex-col gap-1 px-2">
            {section.items.map((item) => (
              <NavLink key={item.href} item={item} active={isActive(pathname, item)} onNavigate={onNavigate} />
            ))}
          </nav>
        </div>
      ))}
    </div>
  );
}

export function NavLink({
  item,
  active,
  onNavigate,
  size = "md",
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
  size?: "md" | "sm";
}) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-colors ${size === "md" ? "text-sm" : "text-xs"} ${
        active ? "bg-primary-strong/15 font-medium text-primary" : "text-fg-muted hover:bg-surface hover:text-fg"
      }`}
    >
      <MsIcon name={item.icon} size={size === "md" ? 18 : 16} />
      {item.label}
      {item.badge && (
        <Badge tone={item.badgeTone ?? "neutral"} className="ml-auto">
          {item.badge}
        </Badge>
      )}
    </Link>
  );
}

export function FooterNav({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Cuenta" className="flex flex-col gap-1">
      {items.map((item) => (
        <NavLink key={item.href} item={item} active={isActive(pathname, item)} onNavigate={onNavigate} size="sm" />
      ))}
    </nav>
  );
}
