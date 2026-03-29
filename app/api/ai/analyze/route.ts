import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

function buildPrompt(context: string, data: any): string {
  const basePrompt = `Bạn là trợ lý phân tích kinh doanh của Mắt Bão Corporation (MBC).
QUAN TRỌNG: Chỉ phân tích DỰA TRÊN DỮ LIỆU THỰC TẾ được cung cấp bên dưới. Không được tự thêm thông tin, số liệu, hoặc giả định ngoài dữ liệu đã cho. Nếu thiếu dữ liệu để nhận xét một điểm nào đó, hãy bỏ qua điểm đó.
Trả lời bằng tiếng Việt, ngắn gọn, súc tích theo cấu trúc: 📊 Tổng Quan, ✅ Điểm Mạnh, ⚠️ Điểm Cần Cải Thiện, 💡 Đề Xuất Hành Động.
Mỗi mục chỉ nêu những gì có căn cứ từ số liệu thực tế.`;

  if (context === "overview") {
    const months = (data.revenueType ?? []) as any[];
    const totalDk = months.reduce((s: number, m: any) => s + (m.dangKyMoi ?? 0), 0);
    const totalGh = months.reduce((s: number, m: any) => s + (m.giaHan ?? 0), 0);
    const totalDk25 = months.reduce((s: number, m: any) => s + (m.prev_dk ?? 0), 0);
    const totalGh25 = months.reduce((s: number, m: any) => s + (m.prev_gh ?? 0), 0);
    const monthRows = months.map((m: any) =>
      `  ${m.month}: ĐK Mới ${m.dangKyMoi.toFixed(3)} tỷ (HN ${m.dkHn?.toFixed(3) ?? 0}, HCM ${m.dkHcm?.toFixed(3) ?? 0}) | Gia Hạn ${m.giaHan.toFixed(3)} tỷ (HN ${m.ghHn?.toFixed(3) ?? 0}, HCM ${m.ghHcm?.toFixed(3) ?? 0})`
    ).join("\n");
    const svcRows = ((data.serviceMonthly ?? []) as any[]).map((s: any) =>
      `  ${s.name}: ${(s.values ?? []).reduce((a: number, v: number) => a + v, 0).toFixed(2)} tỷ`
    ).join("\n");
    return `${basePrompt}

DỮ LIỆU TỔNG QUAN 2026 (các tháng có dữ liệu):
- Tổng Đăng Ký Mới: ${totalDk.toFixed(3)} tỷ VNĐ (cùng kỳ 2025: ${totalDk25.toFixed(3)} tỷ)
- Tổng Gia Hạn: ${totalGh.toFixed(3)} tỷ VNĐ (cùng kỳ 2025: ${totalGh25.toFixed(3)} tỷ)
- Tổng Doanh Số: ${(totalDk + totalGh).toFixed(3)} tỷ VNĐ

CHI TIẾT TỪNG THÁNG:
${monthRows}

DOANH SỐ THEO LOẠI DỊCH VỤ (tỷ VNĐ):
${svcRows || "Không có dữ liệu"}`;
  }

  if (context === "teams") {
    const { period, teams, totalRev, totalTarget, prevRev, prevLabel, prevYearRev, hnRev, hcmRev } = data ?? {};
    const teamList = Array.isArray(teams) ? teams : [];
    const teamRows = teamList.map((t: any) => {
      const pct = t.target > 0 ? Math.round(t.revenue / t.target * 100) : 0;
      const svc = [
        t.hostMail > 0 ? `Host/Mail ${t.hostMail.toFixed(0)}M` : "",
        t.msgws    > 0 ? `MSGWS ${t.msgws.toFixed(0)}M` : "",
        t.tenMien  > 0 ? `Tên miền ${t.tenMien.toFixed(0)}M` : "",
        t.transferGws > 0 ? `Transfer GWS ${t.transferGws.toFixed(0)}M` : "",
        t.saleAi   > 0 ? `Sale AI ${t.saleAi.toFixed(0)}M` : "",
        t.elastic  > 0 ? `Elastic ${t.elastic.toFixed(0)}M` : "",
      ].filter(Boolean).join(", ");
      return `  [${t.region}] ${t.teamName}: DS ${t.revenue.toFixed(0)}M / MT ${t.target.toFixed(0)}M (${pct}%) — ${svc || "chưa có dữ liệu dịch vụ"}`;
    }).join("\n");
    const totalPct  = totalTarget > 0 ? Math.round(totalRev / totalTarget * 100) : 0;
    const momLine   = prevRev > 0 ? `- So với ${prevLabel}: ${prevRev.toFixed(0)}M (${((totalRev - prevRev) / prevRev * 100).toFixed(1)}%)` : "";
    const yoyLine   = prevYearRev > 0 ? `- Cùng kỳ 2025: ${prevYearRev.toFixed(0)}M (${((totalRev - prevYearRev) / prevYearRev * 100).toFixed(1)}%)` : "";
    return `${basePrompt}

DỮ LIỆU CHI TIẾT DOANH SỐ KỲ ${period ?? ""} (đơn vị: triệu VNĐ):
- Tổng Doanh Số: ${(totalRev ?? 0).toFixed(0)}M / Mục tiêu: ${(totalTarget ?? 0).toFixed(0)}M (đạt ${totalPct}%)
- Khu vực HN: ${(hnRev ?? 0).toFixed(0)}M | Khu vực HCM: ${(hcmRev ?? 0).toFixed(0)}M
${momLine}
${yoyLine}

CHI TIẾT TỪNG TEAM:
${teamRows || "Không có dữ liệu team"}`;
  }

  if (context === "personal") {
    const revPct = Math.round(data.revenue / data.target.revenue * 100);
    return `${basePrompt}

DỮ LIỆU CÁ NHÂN: ${data.name} (${data.teamName})
- Doanh số: ${(data.revenue / 1e6).toFixed(0)}M / ${(data.target.revenue / 1e6).toFixed(0)}M VNĐ (${revPct}%)
- Đơn hàng: ${data.orders} / ${data.target.orders} (${Math.round(data.orders / data.target.orders * 100)}%)
- Khách hàng: ${data.customers} / ${data.target.customers} (${Math.round(data.customers / data.target.customers * 100)}%)`;
  }

  if (context === "weekly") {
    const taskList = (data.tasks ?? []).map((t: any) =>
      `- [${t.status}] ${t.title} (${t.progress}%)`
    ).join("\n");
    return `${basePrompt}

DỮ LIỆU BÁO CÁO TUẦN: ${data.week}
- Tổng tác vụ: ${data.total ?? data.tasks?.length ?? 0}
- Hoàn thành: ${data.done} | Đang làm: ${data.inprogress} | Chưa bắt đầu: ${data.notstarted}
- Tiến độ trung bình: ${data.avgProgress}%

DANH SÁCH TÁC VỤ:
${taskList || "Không có tác vụ"}`;
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
          generationConfig: { maxOutputTokens: 4096 },
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
