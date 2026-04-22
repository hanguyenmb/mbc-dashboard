export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CustomersClient } from "./customers-client";
import { getData, getLastUpdated } from "@/lib/db";
import { TEAM_SERVICE_DATA } from "@/lib/mock-data";
import type { TeamMonthlyData, ServiceConfig } from "@/lib/types";
import { DEFAULT_SERVICE_CONFIG } from "@/lib/types";

function normalizeTeamData(raw: any): TeamMonthlyData {
  if (!raw) return TEAM_SERVICE_DATA;
  if (Array.isArray(raw) && raw.length > 0 && !("month" in raw[0])) return TEAM_SERVICE_DATA;
  return raw as TeamMonthlyData;
}

export default async function CustomersPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const user = session.user as any;
  if (user.role !== "admin" && user.role !== "viewer" && user.role !== "teams_only") redirect("/dashboard");

  const [raw, rawPrev, serviceConfig, lastUpdated] = await Promise.all([
    getData<any>("team_service").catch(() => null),
    getData<any>("team_service_prev").catch(() => null),
    getData<ServiceConfig[]>("service_config").catch(() => null),
    getLastUpdated("team_service").catch(() => null),
  ]);

  return (
    <CustomersClient
      role={user.role}
      teamId={user.teamId}
      teamServiceData={normalizeTeamData(raw)}
      teamPrevData={normalizeTeamData(rawPrev)}
      serviceConfig={serviceConfig ?? DEFAULT_SERVICE_CONFIG}
      lastUpdated={lastUpdated as string | null}
    />
  );
}
