import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { WeeklyClient } from "./weekly-client";

export default async function WeeklyPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if ((session.user as any)?.role === "teams_only") redirect("/dashboard/teams");

  return (
    <WeeklyClient
      userName={session.user?.name ?? ""}
      role={(session.user as any)?.role ?? "employee"}
    />
  );
}
