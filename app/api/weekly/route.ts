import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/db";
import { WEEKLY_TASKS } from "@/lib/mock-data";

// GET /api/weekly?weekKey=2026-W12
export async function GET(req: NextRequest) {
  const weekKey = req.nextUrl.searchParams.get("weekKey");
  if (!weekKey) return NextResponse.json({ error: "Missing weekKey" }, { status: 400 });

  try {
    const sb = supabaseAdmin();
    const { data, error } = await sb
      .from("weekly_tasks")
      .select("*")
      .eq("week_key", weekKey)
      .order("created_at", { ascending: true });

    if (error) throw error;

    // Nếu chưa có data trong DB, seed từ mock
    if (!data || data.length === 0) {
      const mockForWeek = WEEKLY_TASKS.filter((t) => t.weekKey === weekKey);
      if (mockForWeek.length > 0) {
        const rows = mockForWeek.map((t) => ({
          id: t.id, title: t.title, description: t.description ?? null,
          category: t.category, status: t.status, progress: t.progress,
          week_key: t.weekKey,
        }));
        await sb.from("weekly_tasks").upsert(rows, { onConflict: "id" });
        return NextResponse.json({ tasks: mockForWeek });
      }
      return NextResponse.json({ tasks: [] });
    }

    // Map snake_case → camelCase
    const tasks = data.map((r: any) => ({
      id: r.id, title: r.title, description: r.description,
      category: r.category, status: r.status, progress: r.progress,
      weekKey: r.week_key,
    }));
    return NextResponse.json({ tasks });
  } catch (err) {
    // Fallback mock nếu Supabase lỗi
    const tasks = WEEKLY_TASKS.filter((t) => t.weekKey === weekKey);
    return NextResponse.json({ tasks });
  }
}

// POST /api/weekly — tạo task mới (manager only)
export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as any;
  if (!session || user?.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { title, description, category, status, progress, weekKey } = body;
  if (!title || !category || !weekKey)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const id = `w-${Date.now()}`;
  const sb = supabaseAdmin();
  const { error } = await sb.from("weekly_tasks").insert({
    id, title, description: description ?? null,
    category, status: status ?? "notstarted",
    progress: progress ?? 0, week_key: weekKey,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, id });
}

// PUT /api/weekly — cập nhật task (admin only)
export async function PUT(req: NextRequest) {
  const session = await auth();
  const user = session?.user as any;
  if (!session || user?.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const sb = supabaseAdmin();
  const dbUpdates: any = { updated_at: new Date().toISOString() };
  if (updates.title       !== undefined) dbUpdates.title       = updates.title;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.category    !== undefined) dbUpdates.category    = updates.category;
  if (updates.status      !== undefined) dbUpdates.status      = updates.status;
  if (updates.progress    !== undefined) dbUpdates.progress    = updates.progress;

  const { error } = await sb.from("weekly_tasks").update(dbUpdates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// DELETE /api/weekly?id=xxx (admin only)
export async function DELETE(req: NextRequest) {
  const session = await auth();
  const user = session?.user as any;
  if (!session || user?.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const sb = supabaseAdmin();
  const { error } = await sb.from("weekly_tasks").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
