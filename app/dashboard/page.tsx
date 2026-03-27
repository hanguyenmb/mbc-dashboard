import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { OverviewClient } from "./overview-client";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const user = session.user as any;
  if (user.role !== "manager") redirect("/dashboard/personal");
  return <OverviewClient userName={user.name} />;
}
