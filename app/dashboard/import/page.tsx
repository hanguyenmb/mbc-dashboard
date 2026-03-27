import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ImportClient } from "./import-client";

export default async function ImportPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const user = session.user as any;
  if (user.role !== "manager") redirect("/dashboard");
  return <ImportClient userEmail={user.email} />;
}
