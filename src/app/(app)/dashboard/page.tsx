import type { Metadata } from "next";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { AssetAllocation } from "@/components/dashboard/AssetAllocation";
import { TopMovers } from "@/components/dashboard/TopMovers";
import { CaucionCard, NovaInsight } from "@/components/dashboard/NovaInsight";
import { RecentOrders } from "@/components/dashboard/RecentOrders";

export const metadata: Metadata = { title: "Dashboard · Nodo Trading" };

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="sr-only">Dashboard general</h1>
      <KpiCards />
      <PerformanceChart />
      <div className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-4">
          <AssetAllocation />
        </div>
        <div className="xl:col-span-5">
          <TopMovers />
        </div>
        <div className="flex flex-col gap-4 xl:col-span-3">
          <NovaInsight />
          <CaucionCard />
        </div>
      </div>
      <RecentOrders />
    </div>
  );
}
