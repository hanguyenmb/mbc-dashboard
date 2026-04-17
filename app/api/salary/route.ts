import { NextRequest, NextResponse } from "next/server";
import { getData, setData } from "@/lib/db";
import type { SalaryData } from "@/lib/types";

export async function GET() {
  try {
    const data = await getData<SalaryData>("salary_data");
    return NextResponse.json({ data: data ?? [] });
  } catch {
    return NextResponse.json({ data: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { records } = await req.json() as { records: SalaryData };
    if (!Array.isArray(records)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    const existing = await getData<SalaryData>("salary_data") ?? [];
    const incoming = records as SalaryData;

    // Upsert: replace records with same month+year, keep others
    const years = [...new Set(incoming.map((r) => r.year))];
    const months = [...new Set(incoming.map((r) => r.month))];
    const merged = [
      ...existing.filter(
        (r) => !(years.includes(r.year) && months.includes(r.month))
      ),
      ...incoming,
    ].sort((a, b) => a.year - b.year || a.month.localeCompare(b.month, undefined, { numeric: true }));

    await setData("salary_data", merged);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
