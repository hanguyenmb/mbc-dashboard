export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FinanceClient } from "./finance-client";
import { getData } from "@/lib/db";
import { MONTHLY_DATA, TEAM_SERVICE_DATA } from "@/lib/mock-data";
import type { SalaryData, TeamMonthlyData } from "@/lib/types";

export default async function FinancePage() {
  const session = await auth();
  if (!session) redirect("/login");
  const user = session.user as any;
  if (user.role !== "admin" && user.role !== "viewer") redirect("/dashboard");

  const [monthlyRaw, teamServiceRaw, teamServicePrevRaw, salaryRaw] = await Promise.all([
    getData<any>("monthly_data").catch(() => null),
    getData<any>("team_service").catch(() => null),
    getData<any>("team_service_prev").catch(() => null),
    getData<SalaryData>("salary_data").catch(() => null),
  ]);

  return (
    <FinanceClient
      role={user.role}
      monthlyData={monthlyRaw ?? MONTHLY_DATA}
      teamServiceData={(Array.isArray(teamServiceRaw) && teamServiceRaw.length > 0 && "month" in teamServiceRaw[0]) ? teamServiceRaw : TEAM_SERVICE_DATA}
      teamServicePrev={(Array.isArray(teamServicePrevRaw) && teamServicePrevRaw.length > 0 && "month" in teamServicePrevRaw[0]) ? teamServicePrevRaw : TEAM_SERVICE_DATA}
      salaryData={salaryRaw ?? []}
    />
  );
}
