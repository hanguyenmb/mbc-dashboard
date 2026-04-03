import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { OverviewClient } from "./overview-client";
import { getData, getLastUpdated } from "@/lib/db";
import { MONTHLY_DATA, SERVICE_MONTHLY, REVENUE_TYPE, TEAM_SERVICE_DATA } from "@/lib/mock-data";
import type { TeamMonthlyData } from "@/lib/types";

const SVC_FIELDS = ["hostMail","msgws","tenMien","transferGws","saleAi","elastic"] as const;

function deriveServiceMonthly(teamMonthlyData: TeamMonthlyData): typeof SERVICE_MONTHLY {
  return teamMonthlyData.map(({ month, teams }) => {
    const hnTeams = teams.filter(t => t.region === "HN");
    const hcmTeams = teams.filter(t => t.region === "HCM");
    const sumSvc = (ts: typeof teams) =>
      Object.fromEntries(SVC_FIELDS.map(f => [f, ts.reduce((s, t) => s + (t[f] ?? 0), 0)]));
    return {
      month,
      ...Object.fromEntries(SVC_FIELDS.map(f => [f, teams.reduce((s, t) => s + (t[f] ?? 0), 0)])),
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

  const [monthlyData, revenueType, teamService, lastUpdated] = await Promise.all([
    getData<typeof MONTHLY_DATA>("monthly_data").then(d => d ?? MONTHLY_DATA),
    getData<typeof REVENUE_TYPE>("revenue_type").then(d => d ?? REVENUE_TYPE),
    getData<TeamMonthlyData>("team_service").then(d => d ?? TEAM_SERVICE_DATA),
    getLastUpdated("monthly_data"),
  ]).catch(() => [MONTHLY_DATA, REVENUE_TYPE, TEAM_SERVICE_DATA, null]);

  const serviceMonthly = deriveServiceMonthly(teamService as TeamMonthlyData);

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
