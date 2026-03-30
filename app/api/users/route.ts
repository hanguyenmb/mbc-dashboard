import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getData, setData } from "@/lib/db";
import { USERS } from "@/lib/mock-data";
import type { User } from "@/lib/types";

async function loadUsers(): Promise<User[]> {
  const db = await getData<User[]>("users").catch(() => null);
  return db && db.length > 0 ? db : [...USERS];
}

// GET — trả về danh sách users (không trả password)
export async function GET() {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const users = await loadUsers();
  return NextResponse.json(users.map(u => ({ ...u, password: "••••••" })));
}

// POST — tạo user mới
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, email, password, role } = await req.json();
  if (!name?.trim() || !email?.trim() || !password?.trim() || !role)
    return NextResponse.json({ error: "Thiếu thông tin" }, { status: 400 });

  const users = await loadUsers();
  if (users.find(u => u.email === email))
    return NextResponse.json({ error: "Tài khoản đã tồn tại" }, { status: 400 });

  const newUser: User = {
    id: `u${Date.now()}`,
    name: name.trim(),
    email: email.trim(),
    password: password.trim(),
    role,
    teamId: null,
    avatar: name.trim()[0].toUpperCase(),
  };
  await setData("users", [...users, newUser]);
  return NextResponse.json({ success: true, user: { ...newUser, password: "••••••" } });
}

// PUT — cập nhật user
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, name, email, password, role } = await req.json();
  if (!id) return NextResponse.json({ error: "Thiếu id" }, { status: 400 });

  const users = await loadUsers();
  const updated = users.map(u => {
    if (u.id !== id) return u;
    return {
      ...u,
      name:     name?.trim()     ?? u.name,
      email:    email?.trim()    ?? u.email,
      // Chỉ update password nếu không phải placeholder
      password: password && password !== "••••••" ? password.trim() : u.password,
      role:     role              ?? u.role,
      avatar:   (name?.trim() ?? u.name)[0].toUpperCase(),
    };
  });
  await setData("users", updated);
  return NextResponse.json({ success: true });
}

// DELETE — xóa user
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as any).role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "Thiếu id" }, { status: 400 });

  const users = await loadUsers();
  const target = users.find(u => u.id === id);
  if (target?.role === "admin" && users.filter(u => u.role === "admin").length <= 1)
    return NextResponse.json({ error: "Phải giữ ít nhất 1 tài khoản admin" }, { status: 400 });

  await setData("users", users.filter(u => u.id !== id));
  return NextResponse.json({ success: true });
}
