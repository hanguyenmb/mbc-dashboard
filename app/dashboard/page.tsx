import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { OverviewClient } from "./overview-client";
import { getData, getLastUpdated } from "@/lib/db";
import { MONTHLY_DATA, SERVICE_MONTHLY, REVENUE_TYPE } from "@/lib/mock-data";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const user = session.user as any;
  if (user.role === "teams_only") redirect("/dashboard/teams");
  if (user.role !== "admin" && user.role !== "viewer") redirect("/login");

  const [monthlyData, serviceMonthly, revenueType, lastUpdated] = await Promise.all([
    getData<typeof MONTHLY_DATA>("monthly_data").then(d => d ?? MONTHLY_DATA),
    getData<typeof SERVICE_MONTHLY>("service_monthly").then(d => d ?? SERVICE_MONTHLY),
    getData<typeof REVENUE_TYPE>("revenue_type").then(d => d ?? REVENUE_TYPE),
    getLastUpdated("monthly_data"),
  ]).catch(() => [MONTHLY_DATA, SERVICE_MONTHLY, REVENUE_TYPE, null]);

  return (
    <OverviewClient
      userName={user.name}
      monthlyData={monthlyData as typeof MONTHLY_DATA}
      serviceMonthly={serviceMonthly as typeof SERVICE_MONTHLY}
      revenueType={revenueType as typeof REVENUE_TYPE}
      lastUpdated={lastUpdated as string | null}
    />
  );
}
