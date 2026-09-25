import { AppShell } from "@/components/layout/AppShell";
import { MarketProvider } from "@/components/market/MarketProvider";
import { TradingProvider } from "@/components/trading/TradingProvider";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <MarketProvider>
      <TradingProvider>
        <AppShell variant="user">{children}</AppShell>
      </TradingProvider>
    </MarketProvider>
  );
}
