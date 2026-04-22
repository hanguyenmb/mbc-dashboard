export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { OverviewClient } from "./overview-client";
import { getData, getLastUpdated } from "@/lib/db";
import { MONTHLY_DATA, SERVICE_MONTHLY, REVENUE_TYPE, TEAM_SERVICE_DATA } from "@/lib/mock-data";
import { DEFAULT_SERVICE_CONFIG } from "@/lib/types";
import type { TeamMonthlyData, ServiceConfig } from "@/lib/types";

function deriveServiceMonthly(teamMonthlyData: TeamMonthlyData, svcKeys: string[]): typeof SERVICE_MONTHLY {
  return teamMonthlyData.map(({ month, teams }) => {
    const hnTeams = teams.filter(t => t.region === "HN");
    const hcmTeams = teams.filter(t => t.region === "HCM");
    const sumSvc = (ts: typeof teams) =>
      Object.fromEntries(svcKeys.map(f => [f, ts.reduce((s, t) => s + ((t as any)[f] ?? 0), 0)]));
    return {
      month,
      ...Object.fromEntries(svcKeys.map(f => [f, teams.reduce((s, t) => s + ((t as any)[f] ?? 0), 0)])),
      hn: sumSvc(hnTeams),
      hcm: sumSvc(hcmTeams),
    } as any;
  });
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const user = session.user as any;
  if (user.role === "teams_only") redirect("/dashboard/teams");
  if (user.role !== "admin" && user.role !== "viewer") redirect("/login");

  const [monthlyData, revenueType, teamService, serviceConfigRaw, lastUpdated] = await Promise.all([
    getData<typeof MONTHLY_DATA>("monthly_data").then(d => d ?? MONTHLY_DATA),
    getData<typeof REVENUE_TYPE>("revenue_type").then(d => d ?? REVENUE_TYPE),
    getData<TeamMonthlyData>("team_service").then(d => d ?? TEAM_SERVICE_DATA),
    getData<ServiceConfig[]>("service_config").then(d => d ?? DEFAULT_SERVICE_CONFIG),
    getLastUpdated("monthly_data"),
  ]).catch(() => [MONTHLY_DATA, REVENUE_TYPE, TEAM_SERVICE_DATA, DEFAULT_SERVICE_CONFIG, null]);

  const serviceConfig = (serviceConfigRaw as ServiceConfig[]) ?? DEFAULT_SERVICE_CONFIG;
  const svcKeys = serviceConfig.map((s: ServiceConfig) => s.key);

  // Sync hn/hcm từ revenue_type để overview luôn khớp, không cần save thủ công
  const syncedMonthly = (monthlyData as typeof MONTHLY_DATA).map(row => {
    const rev = (revenueType as typeof REVENUE_TYPE).find((r: any) => r.month === row.month);
    if (!rev) return row;
    const hn  = ((rev as any).dkHn  ?? 0) + ((rev as any).ghHn  ?? 0);
    const hcm = ((rev as any).dkHcm ?? 0) + ((rev as any).ghHcm ?? 0);
    if (hn === 0 && hcm === 0) return row;
    return { ...row, hn, hcm };
  });

  const serviceMonthly = deriveServiceMonthly(teamService as TeamMonthlyData, svcKeys);

  return (
    <OverviewClient
      userName={user.name}
      monthlyData={syncedMonthly}
      serviceMonthly={serviceMonthly as typeof SERVICE_MONTHLY}
      serviceConfig={serviceConfig}
      revenueType={revenueType as typeof REVENUE_TYPE}
      lastUpdated={lastUpdated as string | null}
    />
  );
}
