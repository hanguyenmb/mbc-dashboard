import { NextResponse } from "next/server";
import { setData } from "@/lib/db";
import { MONTHLY_DATA, SERVICE_MONTHLY, REVENUE_TYPE, SERVICE_GROUPS } from "@/lib/mock-data";

export async function GET() {
  try {
    await setData("monthly_data",   MONTHLY_DATA);
    await setData("service_monthly", SERVICE_MONTHLY);
    await setData("revenue_type",   REVENUE_TYPE);
    await setData("service_groups", SERVICE_GROUPS);

    return NextResponse.json({ success: true, message: "Đã seed dữ liệu lên Supabase!" });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
