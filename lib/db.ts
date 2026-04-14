import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Server-side client (full access, dùng trong API routes)
// Dùng cache: 'no-store' để tránh Next.js cache cũ sau khi lưu dữ liệu mới
export const supabaseAdmin = () =>
  createClient(supabaseUrl, supabaseServiceKey, {
    global: { fetch: (url, opts) => fetch(url, { ...opts, cache: "no-store" }) },
  });

// Client-side client (read only, dùng trong components)
export const supabaseClient = () =>
  createClient(supabaseUrl, supabaseAnonKey);

// ── Data store helpers ────────────────────────────────────────────────────────

export type DataKey =
  | "monthly_data"
  | "service_monthly"
  | "revenue_type"
  | "service_groups"
  | "team_service"
  | "team_service_prev"
  | "service_config"
  | "users";

export async function getData<T>(key: DataKey): Promise<T | null> {
  const sb = supabaseAdmin();
  const { data, error } = await sb
    .from("data_store")
    .select("data")
    .eq("key", key)
    .single();

  if (error || !data) return null;
  return data.data as T;
}

export async function setData<T>(key: DataKey, value: T): Promise<void> {
  const sb = supabaseAdmin();
  await sb.from("data_store").upsert(
    { key, data: value, updated_at: new Date().toISOString() },
    { onConflict: "key" }
  );
}

export async function getLastUpdated(key: DataKey): Promise<string | null> {
  const sb = supabaseAdmin();
  const { data } = await sb
    .from("data_store")
    .select("updated_at")
    .eq("key", key)
    .single();
  return data?.updated_at ?? null;
}
