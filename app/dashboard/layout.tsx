export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import type { UserRole } from "@/lib/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const user = session.user as any;

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar
        role={user.role as UserRole}
        userName={user.name ?? ""}
        userAvatar={user.avatar ?? user.name?.[0] ?? "U"}
      />
      <main className="ml-56 min-h-screen">
        {children}
      </main>
    </div>
  );
}
