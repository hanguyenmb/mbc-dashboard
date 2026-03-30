import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Quy tắc chung cho tất cả context
const STRICT_RULE = `QUAN TRỌNG: Chỉ phân tích DỰA TRÊN DỮ LIỆU THỰC TẾ được cung cấp. Không tự thêm số liệu hay giả định. Nếu thiếu dữ liệu để nhận xét một điểm, hãy bỏ qua điểm đó. Trả lời bằng tiếng Việt, súc tích, dùng bullet points.`;

function buildPrompt(context: string, data: any): string {

  // ─── OVERVIEW: Góc nhìn CFO / Giám đốc Kinh doanh ───────────────────────────
  if (context === "overview") {
    const months = (data.revenueType ?? []) as any[];
    const totalDk   = months.reduce((s: number, m: any) => s + (m.dangKyMoi ?? 0), 0);
    const totalGh   = months.reduce((s: number, m: any) => s + (m.giaHan ?? 0), 0);
    const totalDk25 = months.reduce((s: number, m: any) => s + (m.prev_dk ?? 0), 0);
    const totalGh25 = months.reduce((s: number, m: any) => s + (m.prev_gh ?? 0), 0);
    const total     = totalDk + totalGh;
    const ghRate    = total > 0 ? ((totalGh / total) * 100).toFixed(1) : "0";
    const ghRate25  = (totalDk25 + totalGh25) > 0 ? ((totalGh25 / (totalDk25 + totalGh25)) * 100).toFixed(1) : "0";
    const monthRows = months.map((m: any) =>
      `  ${m.month}: ĐK Mới ${m.dangKyMoi.toFixed(3)} tỷ (HN ${m.dkHn?.toFixed(3) ?? 0}, HCM ${m.dkHcm?.toFixed(3) ?? 0}) | Gia Hạn ${m.giaHan.toFixed(3)} tỷ (HN ${m.ghHn?.toFixed(3) ?? 0}, HCM ${m.ghHcm?.toFixed(3) ?? 0})`
    ).join("\n");
    const svcRows = ((data.serviceMonthly ?? []) as any[]).map((s: any) =>
      `  ${s.name}: ${(s.values ?? []).reduce((a: number, v: number) => a + v, 0).toFixed(2)} tỷ`
    ).join("\n");

    return `Bạn là Giám đốc Kinh doanh & Tài chính (CFO/CSO) của Mắt Bão Corporation (MBC) — công ty cung cấp dịch vụ số B2B (Hosting, Domain, Microsoft/Google Workspace, AI, Elastic). Bạn có 10 năm kinh nghiệm phân tích doanh thu ngành cloud & SaaS, đặc biệt am hiểu về mô hình doanh thu Đăng Ký Mới (acquisition) kết hợp Gia Hạn (retention).
${STRICT_RULE}

Hãy phân tích theo cấu trúc:
📊 **Tổng Quan Doanh Thu** — con số chính, tăng trưởng so cùng kỳ
🔄 **Sức Khỏe Retention** — đánh giá tỷ lệ Gia Hạn, so sánh với 2025, rủi ro churn nếu có
📦 **Cơ Cấu Dịch Vụ** — dịch vụ nào đang kéo tăng trưởng, dịch vụ nào cần chú ý
⚖️ **Cân Bằng Vùng** — hiệu quả HN vs HCM
💡 **Khuyến Nghị Chiến Lược** — 2-3 hành động cụ thể ở cấp lãnh đạo

DỮ LIỆU TỔNG QUAN 2026:
- Tổng Đăng Ký Mới: ${totalDk.toFixed(3)} tỷ (CK 2025: ${totalDk25.toFixed(3)} tỷ)
- Tổng Gia Hạn: ${totalGh.toFixed(3)} tỷ (CK 2025: ${totalGh25.toFixed(3)} tỷ) → Tỷ lệ Gia Hạn: ${ghRate}% (2025: ${ghRate25}%)
- Tổng Doanh Số: ${total.toFixed(3)} tỷ VNĐ

CHI TIẾT TỪNG THÁNG:
${monthRows}

DOANH SỐ THEO DỊCH VỤ (tỷ VNĐ):
${svcRows || "Không có dữ liệu"}`;
  }

  // ─── TEAMS: Góc nhìn Trưởng phòng Kinh doanh ────────────────────────────────
  if (context === "teams") {
    const { period, teams, totalRev, totalTarget, prevRev, prevLabel, prevYearRev, hnRev, hcmRev } = data ?? {};
    const teamList  = Array.isArray(teams) ? teams : [];
    const totalPct  = totalTarget > 0 ? Math.round(totalRev / totalTarget * 100) : 0;
    const momDiff   = prevRev > 0 ? ((totalRev - prevRev) / prevRev * 100).toFixed(1) : null;
    const yoyDiff   = prevYearRev > 0 ? ((totalRev - prevYearRev) / prevYearRev * 100).toFixed(1) : null;

    // Phân loại team: đạt/gần đạt/cần hỗ trợ
    const teamRows = teamList
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .map((t: any) => {
        const pct = t.target > 0 ? Math.round(t.revenue / t.target * 100) : 0;
        const flag = pct >= 100 ? "✅" : pct >= 80 ? "🟡" : "🔴";
        const svc = [
          t.hostMail    > 0 ? `Host/Mail ${t.hostMail.toFixed(0)}M`       : "",
          t.msgws       > 0 ? `MSGWS ${t.msgws.toFixed(0)}M`              : "",
          t.tenMien     > 0 ? `Tên miền ${t.tenMien.toFixed(0)}M`         : "",
          t.transferGws > 0 ? `Transfer GWS ${t.transferGws.toFixed(0)}M` : "",
          t.saleAi      > 0 ? `Sale AI ${t.saleAi.toFixed(0)}M`           : "",
          t.elastic     > 0 ? `Elastic ${t.elastic.toFixed(0)}M`          : "",
        ].filter(Boolean).join(", ");
        return `  ${flag} [${t.region}] ${t.teamName}: ${t.revenue.toFixed(0)}M / ${t.target.toFixed(0)}M (${pct}%)${svc ? " | " + svc : ""}`;
      }).join("\n");

    return `Bạn là Trưởng phòng Kinh doanh của Mắt Bão Corporation (MBC), chuyên phát triển và quản lý đội ngũ sales B2B dịch vụ số (Hosting, Domain, GWS, AI, Elastic). Bạn biết cách đọc hiệu suất từng team, xác định nguyên nhân underperformance và đưa ra giải pháp coaching thực tế.
${STRICT_RULE}

Hãy phân tích theo cấu trúc:
📊 **Tổng Quan Kỳ ${period ?? ""}** — tỷ lệ đạt MT, so sánh kỳ trước và cùng kỳ 2025
🏆 **Team Dẫn Đầu** — điểm nổi bật, dịch vụ thế mạnh
🔴 **Team Cần Hỗ Trợ** — nhận diện vấn đề cụ thể (thiếu dịch vụ nào, khoảng cách bao nhiêu)
⚖️ **So Sánh HN vs HCM** — cân bằng và phân bố
💡 **Hành Động Ưu Tiên** — 2-3 việc cụ thể trưởng phòng cần làm ngay tuần này

DỮ LIỆU KỲ ${period ?? ""} (đơn vị: triệu VNĐ):
- Tổng: ${(totalRev ?? 0).toFixed(0)}M / MT: ${(totalTarget ?? 0).toFixed(0)}M → Đạt ${totalPct}%
- HN: ${(hnRev ?? 0).toFixed(0)}M | HCM: ${(hcmRev ?? 0).toFixed(0)}M
${momDiff !== null ? `- So ${prevLabel}: ${(prevRev ?? 0).toFixed(0)}M (${momDiff > "0" ? "+" : ""}${momDiff}%)` : ""}
${yoyDiff !== null ? `- Cùng kỳ 2025: ${(prevYearRev ?? 0).toFixed(0)}M (${yoyDiff > "0" ? "+" : ""}${yoyDiff}%)` : ""}

BẢNG XẾP HẠNG TEAM (DS cao → thấp):
${teamRows || "Không có dữ liệu team"}`;
  }

  // ─── PERSONAL: Góc nhìn Sales Coach ─────────────────────────────────────────
  if (context === "personal") {
    const rev      = data.revenue ?? 0;
    const tRev     = data.target?.revenue ?? 1;
    const orders   = data.orders ?? 0;
    const tOrders  = data.target?.orders ?? 1;
    const custs    = data.customers ?? 0;
    const tCusts   = data.target?.customers ?? 1;
    const revPct   = Math.round((rev / tRev) * 100);
    const ordPct   = Math.round((orders / tOrders) * 100);
    const custPct  = Math.round((custs / tCusts) * 100);

    // Chẩn đoán nhanh: DS thấp do đơn ít hay đơn nhỏ?
    const avgRevPerOrder = orders > 0 ? (rev / 1e6 / orders).toFixed(1) : null;
    const targetAvgRev   = tOrders > 0 ? ((tRev / 1e6) / tOrders).toFixed(1) : null;

    return `Bạn là Sales Coach B2B chuyên đồng hành giúp nhân viên kinh doanh dịch vụ số tự nhìn nhận và cải thiện hiệu suất. Phong cách của bạn: thẳng thắn nhưng khích lệ, luôn chỉ ra nguyên nhân gốc rễ và hành động cụ thể — không phán xét chung chung.
${STRICT_RULE}

Hãy phân tích theo cấu trúc:
📊 **Kết Quả Hiện Tại** — 3 chỉ số chính với nhận xét ngắn
🔍 **Chẩn Đoán** — DS thấp/cao vì lý do gì? (pipeline ít, đơn nhỏ, chuyển đổi thấp?)
🎯 **Mục Tiêu Tuần Tới** — 2-3 hành động CỤ THỂ, ĐO LƯỜNG ĐƯỢC để cải thiện
💪 **Động Lực** — 1 câu khích lệ dựa trên điểm mạnh nhìn thấy từ số liệu

DỮ LIỆU CÁ NHÂN: ${data.name ?? "—"} (${data.teamName ?? "—"})
- Doanh số: ${(rev / 1e6).toFixed(0)}M / ${(tRev / 1e6).toFixed(0)}M (${revPct}%)
- Đơn hàng: ${orders} / ${tOrders} (${ordPct}%)
- Khách hàng: ${custs} / ${tCusts} (${custPct}%)
${avgRevPerOrder !== null ? `- DS trung bình/đơn: ${avgRevPerOrder}M (mục tiêu: ${targetAvgRev}M/đơn)` : ""}`;
  }

  // ─── WEEKLY: Góc nhìn Quản lý Vận hành ──────────────────────────────────────
  if (context === "weekly") {
    const tasks      = (data.tasks ?? []) as any[];
    const done       = tasks.filter((t: any) => t.status === "done");
    const inprogress = tasks.filter((t: any) => t.status === "inprogress");
    const notstarted = tasks.filter((t: any) => t.status === "notstarted");
    const blocked    = inprogress.filter((t: any) => t.progress < 20); // đang làm nhưng tiến độ thấp = có thể bị block

    const taskRows = tasks
      .sort((a: any, b: any) => {
        const order: Record<string, number> = { inprogress: 0, notstarted: 1, done: 2 };
        return (order[a.status] ?? 3) - (order[b.status] ?? 3);
      })
      .map((t: any) => {
        const icon = t.status === "done" ? "✅" : t.status === "inprogress" ? "🔄" : "⬜";
        return `  ${icon} ${t.title} (${t.progress}%)`;
      }).join("\n");

    return `Bạn là Quản lý Vận hành (Operations Manager) của Mắt Bão Corporation, chuyên tháo gỡ bottleneck, ưu tiên hóa công việc và đảm bảo đội nhóm hoàn thành mục tiêu đúng hạn. Bạn đọc báo cáo tuần và đưa ra quyết định thực tế, không lý thuyết.
${STRICT_RULE}

Hãy phân tích theo cấu trúc:
📊 **Tình Trạng Tuần ${data.week ?? ""}** — tổng quan tiến độ, tỷ lệ hoàn thành
⚠️ **Rủi Ro & Bottleneck** — việc nào đang bị stuck, nguy cơ trễ
🎯 **Ưu Tiên Ngay** — top 3 việc cần giải quyết trước trong tuần tới
🔄 **Đề Xuất Phân Bổ** — nếu có việc quá tải hoặc lãng phí nguồn lực
💡 **Cải Tiến Quy Trình** — 1 đề xuất nhỏ giúp tuần sau hiệu quả hơn

DỮ LIỆU BÁO CÁO TUẦN: ${data.week ?? ""}
- Tổng: ${tasks.length} tác vụ | ✅ Xong: ${done.length} | 🔄 Đang làm: ${inprogress.length} | ⬜ Chưa bắt đầu: ${notstarted.length}
- Tiến độ TB: ${data.avgProgress ?? 0}%
${blocked.length > 0 ? `- ⚠️ Có thể đang bị block (tiến độ <20%): ${blocked.map((t: any) => t.title).join(", ")}` : ""}

DANH SÁCH TÁC VỤ:
${taskRows || "Không có tác vụ"}`;
  }

  // Fallback
  return `Bạn là chuyên gia phân tích kinh doanh của Mắt Bão Corporation (MBC).
${STRICT_RULE}

DỮ LIỆU:\n${JSON.stringify(data, null, 2)}`;
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
