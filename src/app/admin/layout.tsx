import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = { title: { template: "%s · Staff Nodo", default: "Staff Nodo" } };

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AppShell variant="admin">{children}</AppShell>;
}
