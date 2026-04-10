import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TeamsClient } from "./teams-client";
import { getData } from "@/lib/db";
import { TEAM_SERVICE_DATA, MONTHLY_DATA } from "@/lib/mock-data";
import type { TeamMonthlyData, ServiceConfig } from "@/lib/types";
import { DEFAULT_SERVICE_CONFIG } from "@/lib/types";

function normalizeTeamData(raw: any): TeamMonthlyData {
  if (!raw) return TEAM_SERVICE_DATA;
  if (Array.isArray(raw) && raw.length > 0 && !("month" in raw[0])) return TEAM_SERVICE_DATA;
  return raw as TeamMonthlyData;
}

export default async function TeamsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const user = session.user as any;
  if (user.role !== "admin" && user.role !== "viewer" && user.role !== "teams_only") redirect("/dashboard");

  const [raw, rawPrev, monthlyData, serviceConfig] = await Promise.all([
    getData<any>("team_service").catch(() => null),
    getData<any>("team_service_prev").catch(() => null),
    getData<typeof MONTHLY_DATA>("monthly_data").then(d => d ?? MONTHLY_DATA).catch(() => MONTHLY_DATA),
    getData<ServiceConfig[]>("service_config").catch(() => null),
  ]);

  return (
    <TeamsClient
      role={user.role}
      teamId={user.teamId}
      teamServiceData={normalizeTeamData(raw)}
      teamPrevData={normalizeTeamData(rawPrev)}
      monthlyData={monthlyData}
      serviceConfig={serviceConfig ?? DEFAULT_SERVICE_CONFIG}
    />
  );
}
