import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TeamsClient } from "./teams-client";
import { getData } from "@/lib/db";
import { TEAM_SERVICE_DATA } from "@/lib/mock-data";
import type { TeamMonthlyData } from "@/lib/types";

export default async function TeamsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const user = session.user as any;
  if (user.role !== "admin" && user.role !== "viewer") redirect("/dashboard");

  const raw = await getData<any>("team_service").catch(() => null);
  let teamServiceData: TeamMonthlyData;
  if (!raw) {
    teamServiceData = TEAM_SERVICE_DATA;
  } else if (Array.isArray(raw) && raw.length > 0 && !("month" in raw[0])) {
    // Dữ liệu cũ (TeamServiceRecord[]) → fallback mock
    teamServiceData = TEAM_SERVICE_DATA;
  } else {
    teamServiceData = raw as TeamMonthlyData;
  }

  return <TeamsClient role={user.role} teamId={user.teamId} teamServiceData={teamServiceData} />;
}
