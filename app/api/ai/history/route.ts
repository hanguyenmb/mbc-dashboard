import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/db";

// GET — lấy lịch sử của user hiện tại
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any)?.id ?? (session.user as any)?.email;

  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("ai_history")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ entries: [] });
  return NextResponse.json({ entries: data ?? [] });
}

// POST — lưu 1 phân tích mới
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any)?.id ?? (session.user as any)?.email;

  const { contextLabel, analysis } = await req.json();
  const sb = supabaseAdmin();
  const { error } = await sb.from("ai_history").insert({
    user_id: userId,
    context_label: contextLabel,
    analysis,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// DELETE — xóa 1 entry hoặc tất cả
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as any)?.id ?? (session.user as any)?.email;

  const id = req.nextUrl.searchParams.get("id");
  const sb = supabaseAdmin();

  if (id) {
    await sb.from("ai_history").delete().eq("id", id).eq("user_id", userId);
  } else {
    await sb.from("ai_history").delete().eq("user_id", userId);
  }
  return NextResponse.json({ success: true });
}
