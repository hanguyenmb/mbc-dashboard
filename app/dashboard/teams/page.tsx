import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TeamsClient } from "./teams-client";

export default async function TeamsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const user = session.user as any;
  if (user.role !== "admin" && user.role !== "viewer") redirect("/dashboard");
  return <TeamsClient role={user.role} teamId={user.teamId} />;
}
