"use client";

interface TabItem<T extends string> {
  id: T;
  label: string;
  count?: number | string;
}

interface TabsProps<T extends string> {
  items: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  label: string;
  size?: "sm" | "md";
}

/** Control segmentado (pestañas de filtro). Estado controlado por el padre. */
export function Tabs<T extends string>({ items, value, onChange, label, size = "md" }: TabsProps<T>) {
  return (
    <div role="tablist" aria-label={label} className="flex max-w-full gap-0.5 overflow-x-auto rounded-lg bg-surface-high p-0.5">
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={`flex shrink-0 items-center gap-1.5 rounded-md whitespace-nowrap transition-colors ${
              size === "sm" ? "text-label px-2.5 py-1" : "px-3 py-1.5 text-xs"
            } ${active ? "bg-primary-strong font-semibold text-on-primary" : "text-fg-muted hover:text-fg"}`}
          >
            {item.label}
            {item.count !== undefined && (
              <span className={`text-label rounded px-1 ${active ? "bg-on-primary/20" : "bg-surface-highest text-fg-subtle"}`}>{item.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
