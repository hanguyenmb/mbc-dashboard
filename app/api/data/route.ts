import { NextRequest, NextResponse } from "next/server";
import { getData, setData, getLastUpdated, DataKey } from "@/lib/db";
import {
  MONTHLY_DATA,
  SERVICE_MONTHLY,
  REVENUE_TYPE,
  SERVICE_GROUPS,
  TEAM_SERVICE_DATA,
} from "@/lib/mock-data";

const FALLBACKS: Record<DataKey, unknown> = {
  monthly_data:    MONTHLY_DATA,
  service_monthly: SERVICE_MONTHLY,
  revenue_type:    REVENUE_TYPE,
  service_groups:  SERVICE_GROUPS,
  team_service:      TEAM_SERVICE_DATA,
  team_service_prev: TEAM_SERVICE_DATA,
  users:             [],
};

// GET /api/data?key=monthly_data
export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key") as DataKey | null;
  if (!key || !(key in FALLBACKS)) {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  }

  try {
    const dbData = await getData(key);
    const lastUpdated = await getLastUpdated(key);
    // Dùng DB nếu có, không thì fallback sang mock
    return NextResponse.json({
      data: dbData ?? FALLBACKS[key],
      source: dbData ? "database" : "mock",
      lastUpdated,
    });
  } catch {
    // Nếu chưa setup Supabase thì vẫn trả mock data
    return NextResponse.json({
      data: FALLBACKS[key],
      source: "mock",
      lastUpdated: null,
    });
  }
}

// POST /api/data  { key, data }  — dùng từ import page
export async function POST(req: NextRequest) {
  try {
    const { key, data } = await req.json();
    if (!key || !(key in FALLBACKS)) {
      return NextResponse.json({ error: "Invalid key" }, { status: 400 });
    }
    await setData(key as DataKey, data);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
