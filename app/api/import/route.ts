import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/lib/auth";
import * as XLSX from "xlsx";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const mode = formData.get("mode") as string;

    if (!file) return NextResponse.json({ error: "Không có file" }, { status: 400 });

    let summary = "";

    if (mode === "excel") {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
      const sample = rows.slice(0, 20).map((r: any[]) => r.join(" | ")).join("\n");
      const totalRows = rows.length - 1;

      const msg = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 800,
        messages: [{
          role: "user",
          content: `Bạn là chuyên gia phân tích dữ liệu kinh doanh của Mắt Bão Corporation.
Đây là dữ liệu từ file Excel (${totalRows} dòng dữ liệu). Phân tích và tóm tắt:

${sample}

Hãy:
1. Xác định các cột dữ liệu (doanh số, đơn hàng, khách hàng, v.v.)
2. Tóm tắt tổng quan dữ liệu
3. Nêu bất kỳ vấn đề nào về chất lượng dữ liệu
4. Đề xuất cách sử dụng dữ liệu này trong dashboard

Trả lời ngắn gọn bằng tiếng Việt.`,
        }],
      });

      summary = `✅ Đã đọc ${totalRows} dòng từ "${file.name}"\n\n`;
      summary += msg.content[0].type === "text" ? msg.content[0].text : "";

    } else if (mode === "image") {
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      const mediaType = file.type as "image/jpeg" | "image/png" | "image/webp";

      const msg = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 800,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
            {
              type: "text",
              text: `Bạn là chuyên gia phân tích dữ liệu kinh doanh của Mắt Bão Corporation.
Đây là ảnh báo cáo kinh doanh. Hãy:
1. Đọc và liệt kê tất cả các số liệu quan trọng (doanh số, đơn hàng, khách hàng, v.v.)
2. Tóm tắt tình hình kinh doanh từ báo cáo này
3. Xác định xem đang vượt hay thiếu chỉ tiêu

Trả lời bằng tiếng Việt, rõ ràng và có cấu trúc.`,
            },
          ],
        }],
      });

      summary = `✅ Đã phân tích ảnh "${file.name}"\n\n`;
      summary += msg.content[0].type === "text" ? msg.content[0].text : "";
    }

    return NextResponse.json({ summary });
  } catch (err: any) {
    console.error("Import error:", err);
    return NextResponse.json({ error: err.message || "Lỗi xử lý file" }, { status: 500 });
  }
}
