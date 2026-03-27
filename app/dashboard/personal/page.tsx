import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PersonalClient } from "./personal-client";

export default async function PersonalPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const user = session.user as any;
  return (
    <PersonalClient
      userId={user.id}
      userName={user.name}
      role={user.role}
      teamId={user.teamId}
    />
  );
}
