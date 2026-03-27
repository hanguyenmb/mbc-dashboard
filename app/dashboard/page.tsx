import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { OverviewClient } from "./overview-client";
import { getData } from "@/lib/db";
import { MONTHLY_DATA, SERVICE_MONTHLY, REVENUE_TYPE } from "@/lib/mock-data";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const user = session.user as any;
  if (user.role !== "manager") redirect("/dashboard/personal");

  // Fetch từ Supabase, fallback về mock nếu chưa có
  const [monthlyData, serviceMonthly, revenueType] = await Promise.all([
    getData<typeof MONTHLY_DATA>("monthly_data").then(d => d ?? MONTHLY_DATA),
    getData<typeof SERVICE_MONTHLY>("service_monthly").then(d => d ?? SERVICE_MONTHLY),
    getData<typeof REVENUE_TYPE>("revenue_type").then(d => d ?? REVENUE_TYPE),
  ]).catch(() => [MONTHLY_DATA, SERVICE_MONTHLY, REVENUE_TYPE]);

  return (
    <OverviewClient
      userName={user.name}
      monthlyData={monthlyData as typeof MONTHLY_DATA}
      serviceMonthly={serviceMonthly as typeof SERVICE_MONTHLY}
      revenueType={revenueType as typeof REVENUE_TYPE}
    />
  );
}
