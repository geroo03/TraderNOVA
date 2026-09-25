import { AppShell } from "@/components/layout/AppShell";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return <AppShell variant="user">{children}</AppShell>;
}
