import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

function buildPrompt(context: string, data: any): string {
  const basePrompt = `Bạn là chuyên gia phân tích kinh doanh cao cấp của Mắt Bão Corporation (MBC).
Phân tích dữ liệu sau và đưa ra đánh giá chuyên sâu bằng tiếng Việt.
Trả lời theo cấu trúc rõ ràng với các mục: 📊 Tổng Quan, ✅ Điểm Mạnh, ⚠️ Điểm Cần Cải Thiện, 💡 Đề Xuất Hành Động, 📋 Kế Hoạch Triển Khai.
Ngắn gọn, súc tích, tập trung vào hành động thực tế.`;

  if (context === "overview") {
    return `${basePrompt}

DỮ LIỆU TỔNG QUAN:
- Doanh số Gross: ${(data.grossRevenue / 1e9).toFixed(2)} tỷ VNĐ (mục tiêu: ${(data.targets.grossRevenue / 1e9).toFixed(2)} tỷ) → ${Math.round(data.grossRevenue / data.targets.grossRevenue * 100)}%
- Doanh số Net: ${(data.netRevenue / 1e9).toFixed(2)} tỷ VNĐ → ${Math.round(data.netRevenue / data.targets.netRevenue * 100)}%
- Khách hàng: ${data.customers} / ${data.targets.customers} (${Math.round(data.customers / data.targets.customers * 100)}%)
- Đơn hàng: ${data.orders} / ${data.targets.orders} (${Math.round(data.orders / data.targets.orders * 100)}%)
- ARPC: ${(data.arpc / 1e6).toFixed(1)}M VNĐ | AOV: ${(data.aov / 1e6).toFixed(1)}M VNĐ
- Tăng trưởng Gross: ${data.growth.gross}% | Net: ${data.growth.net}%`;
  }

  if (context === "teams") {
    const teamSummary = Array.isArray(data)
      ? data.map((t: any) => `Team ${t.teamName}: DS ${(t.revenue / 1e6).toFixed(0)}M / ${(t.target.revenue / 1e6).toFixed(0)}M (${Math.round(t.revenue / t.target.revenue * 100)}%), ${t.orders} đơn, ${t.customers} KH`).join("\n")
      : JSON.stringify(data);
    return `${basePrompt}\n\nDỮ LIỆU CÁC TEAM:\n${teamSummary}`;
  }

  if (context === "personal") {
    const revPct = Math.round(data.revenue / data.target.revenue * 100);
    return `${basePrompt}

DỮ LIỆU CÁ NHÂN: ${data.name} (${data.teamName})
- Doanh số: ${(data.revenue / 1e6).toFixed(0)}M / ${(data.target.revenue / 1e6).toFixed(0)}M VNĐ (${revPct}%)
- Đơn hàng: ${data.orders} / ${data.target.orders} (${Math.round(data.orders / data.target.orders * 100)}%)
- Khách hàng: ${data.customers} / ${data.target.customers} (${Math.round(data.customers / data.target.customers * 100)}%)`;
  }

  return `${basePrompt}\n\nDỮ LIỆU:\n${JSON.stringify(data, null, 2)}`;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY chưa được cấu hình" }, { status: 500 });

  try {
    const { context, data } = await req.json();
    const prompt = buildPrompt(context, data);

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 1024 },
        }),
      }
    );

    const json = await res.json();
    if (!res.ok) throw new Error(json.error?.message || "Gemini API error");

    const parts = json.candidates?.[0]?.content?.parts ?? [];
    const text = parts.filter((p: any) => !p.thought).map((p: any) => p.text ?? "").join("");
    return NextResponse.json({ analysis: text });
  } catch (err: any) {
    console.error("AI analyze error:", err);
    return NextResponse.json({ error: err.message || "Lỗi AI" }, { status: 500 });
  }
}
