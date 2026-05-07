import { Suspense } from "react";
import { DashboardClient } from "./dashboard-client";
import { DashboardHeader, DashboardHeaderFallback } from "./dashboard-header";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#f6f8fc]">
      <Suspense fallback={<DashboardHeaderFallback />}>
        <DashboardHeader />
      </Suspense>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <DashboardClient />
      </main>
    </div>
  );
}
