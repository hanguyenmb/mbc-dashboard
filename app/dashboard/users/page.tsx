import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UsersClient } from "./users-client";
import { supabaseAdmin, getData } from "@/lib/db";
import { USERS } from "@/lib/mock-data";
import type { User } from "@/lib/types";

export default async function UsersPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const user = session.user as any;
  if (user.role !== "admin") redirect("/dashboard");

  // Load users từ Supabase, fallback mock
  const dbUsers = await getData<User[]>("users").catch(() => null);
  const initialUsers = dbUsers && dbUsers.length > 0 ? dbUsers : [...USERS];

  // Lấy lần đăng nhập cuối của mỗi user
  const lastLoginMap: Record<string, string> = {};
  try {
    const { data } = await supabaseAdmin()
      .from("login_logs")
      .select("user_email, logged_in_at")
      .order("logged_in_at", { ascending: false });
    if (data) {
      for (const row of data) {
        if (!lastLoginMap[row.user_email]) {
          lastLoginMap[row.user_email] = row.logged_in_at;
        }
      }
    }
  } catch {}

  return <UsersClient initialUsers={initialUsers} lastLoginMap={lastLoginMap} />;
}
