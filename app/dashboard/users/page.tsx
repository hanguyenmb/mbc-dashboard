import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UsersClient } from "./users-client";

export default async function UsersPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const user = session.user as any;
  if (user.role !== "admin") redirect("/dashboard");
  return <UsersClient />;
}
