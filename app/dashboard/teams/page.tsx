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

  const teamServiceData = await getData<TeamMonthlyData>("team_service")
    .then(d => d ?? TEAM_SERVICE_DATA)
    .catch(() => TEAM_SERVICE_DATA);

  return <TeamsClient role={user.role} teamId={user.teamId} teamServiceData={teamServiceData} />;
}
