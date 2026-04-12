"use client";

import { useState } from "react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
  ReferenceLine, LabelList,
} from "recharts";
import { Header, PageHeader } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { QUARTERLY_DATA, MONTHLY_DATA, SERVICE_MONTHLY, REVENUE_TYPE } from "@/lib/mock-data";
import { Sparkles, History, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { AiAnalysisPanel } from "@/components/ai/ai-analysis-panel";
import { AiHistoryPanel } from "@/components/ai/ai-history-panel";

interface OverviewClientProps {
  userName: string;
  monthlyData: typeof MONTHLY_DATA;
  serviceMonthly: typeof SERVICE_MONTHLY;
  revenueType: typeof REVENUE_TYPE;
  lastUpdated?: string | null;
}

// Màu ngưỡng 4 cấp
function thresholdColor(pct: number) {
  if (pct >= 100) return { border: "border-green-500/30",  text: "text-green-400",  bg: "bg-green-500/5",  badge: "bg-green-500/20 text-green-300" };
  if (pct >= 80)  return { border: "border-amber-500/30",  text: "text-amber-400",  bg: "bg-amber-500/5",  badge: "bg-amber-500/20 text-amber-300" };
  if (pct >= 60)  return { border: "border-orange-500/30", text: "text-orange-400", bg: "bg-orange-500/5", badge: "bg-orange-500/20 text-orange-300" };
  return           { border: "border-red-500/30",    text: "text-red-400",    bg: "bg-red-500/5",    badge: "bg-red-500/20 text-red-300" };
}

function TrendBadge({ pct, label }: { pct: number; label: string }) {
  const up = pct >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${up ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
      {up ? "↑" : "↓"} {Math.abs(pct).toFixed(1)}% {label}
    </span>
  );
}

const TOOLTIP_STYLE = {
  contentStyle: {
    background: "#1e293b", border: "1px solid #334155",
    borderRadius: 8, color: "#f1f5f9", fontSize: 12,
  },
};

// Nhãn tooltip formatter
function fmtTip(v: any, name: any) {
  const map: Record<string, string> = {
    hn: "Hà Nội", hcm: "HCM", cumKy: "Kết quả 2025",
    mt8: "Mục tiêu 8%", mt10: "Mục tiêu 10%",
    nam2025: "KQ 2025 (tổng)", nam2026: "Kết quả 2026",
    hn2025: "HN 2025", hcm2025: "HCM 2025",
    hn2026: "HN 2026", hcm2026: "HCM 2026",
    dangKyMoi: "Đăng ký mới", giaHan: "Gia hạn",
  };
  return [`${Number(v).toFixed(2)} tỷ`, map[String(name)] ?? name] as [string, string];
}

// Badge tỉ lệ hoàn thành
function RateBadge({ value, label }: { value: number; label: string }) {
  const color = value >= 100 ? "text-green-400 bg-green-500/10 border-green-500/30"
    : value > 0 ? "text-amber-400 bg-amber-500/10 border-amber-500/30"
    : "text-slate-500 bg-slate-700/30 border-slate-600/30";
  const Icon = value >= 100 ? TrendingUp : value > 0 ? Minus : Minus;
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium ${color}`}>
      <Icon size={12} />
      <span>{label}:</span>
      <span className="font-bold">{value > 0 ? `${value.toFixed(1)}%` : "—"}</span>
    </div>
  );
}

export function OverviewClient({ userName, monthlyData, serviceMonthly, revenueType, lastUpdated }: OverviewClientProps) {
  // Dùng prop (từ DB) thay vì import mock
  const MONTHLY_DATA = monthlyData;
  const SERVICE_MONTHLY = serviceMonthly;
  const REVENUE_TYPE = revenueType;
  const [showAI, setShowAI] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [view, setView] = useState<"thang" | "quy">("thang");
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(new Date().getMonth());
  const [selectedQuarter, setSelectedQuarter] = useState(1);
  const [openDropdown, setOpenDropdown] = useState<"thang" | "quy" | null>(null);
  const [svcView, setSvcView] = useState<"stacked" | "grouped">("stacked");
  const SVC_KEYS = [
    { key: "hostMail",    label: "Hosting/Email",      color: "#0066CC" },
    { key: "msgws",       label: "MS/GWS",             color: "#10B981" },
    { key: "tenMien",     label: "Tên miền + DV khác", color: "#F59E0B" },
    { key: "transferGws", label: "Transfer GWS",       color: "#8B5CF6" },
    { key: "saleAi",      label: "Sale AI",            color: "#EF4444" },
    { key: "elastic",     label: "Elastic",            color: "#06B6D4" },
    { key: "cloudServer", label: "Cloud Server",        color: "#F97316" },
  ] as const;

  // Donut: lọc theo bộ lọc đang chọn
  const svcFilteredMonths = (() => {
    if (view === "thang") {
      const m = SERVICE_MONTHLY[selectedMonthIdx];
      return m ? [m] : SERVICE_MONTHLY;
    }
    // Quý: lấy các tháng trong quý có data
    const start = (selectedQuarter - 1) * 3;
    return SERVICE_MONTHLY.filter((_, i) => i >= start && i < start + 3);
  })();

  const svcLabel = view === "thang"
    ? (SERVICE_MONTHLY[selectedMonthIdx]?.month ?? "Tổng")
    : `Q${selectedQuarter}`;

  const svcQ1 = SVC_KEYS.map((s) => ({
    name: s.label,
    color: s.color,
    value: svcFilteredMonths.reduce((sum, m) => sum + ((m as any)[s.key] as number), 0),
  }));

  const totalService = svcQ1.reduce((s, g) => s + g.value, 0);

  const svcByGroup = SVC_KEYS.map((s) => ({
    name: s.label,
    T1: (SERVICE_MONTHLY[0] as any)[s.key] as number,
    T2: (SERVICE_MONTHLY[1] as any)[s.key] as number,
    T3: (SERVICE_MONTHLY[2] as any)[s.key] as number,
    q1: SERVICE_MONTHLY.reduce((sum, m) => sum + ((m as any)[s.key] as number), 0),
  }));

  // KPI theo tháng được chọn
  const selMonth = MONTHLY_DATA[selectedMonthIdx];
  const selThucHien = selMonth ? (selMonth.hn ?? 0) + (selMonth.hcm ?? 0) : 0;
  const selTlMt8  = selMonth?.mt8  > 0 ? (selThucHien / selMonth.mt8)  * 100 : 0;
  const selTlMt10 = selMonth?.mt10 > 0 ? (selThucHien / selMonth.mt10) * 100 : 0;
  // Trend so tháng trước
  const prevMonth = selectedMonthIdx > 0 ? MONTHLY_DATA[selectedMonthIdx - 1] : null;
  const prevThucHien = prevMonth ? (prevMonth.hn ?? 0) + (prevMonth.hcm ?? 0) : 0;
  const trendThang = prevThucHien > 0 ? ((selThucHien - prevThucHien) / prevThucHien) * 100 : 0;

  // KPI theo quý được chọn
  const qStart = (selectedQuarter - 1) * 3;
  const qMonths = MONTHLY_DATA.slice(qStart, qStart + 3);
  const selQuy = QUARTERLY_DATA[selectedQuarter - 1];
  const tongThucHien = qMonths.reduce((s, m) => s + ((m.hn ?? 0) + (m.hcm ?? 0)), 0);
  const tongMt8  = qMonths.reduce((s, m) => s + m.mt8,  0);
  const tongMt10 = qMonths.reduce((s, m) => s + m.mt10, 0);
  const tlMt8  = tongMt8  > 0 ? (tongThucHien / tongMt8)  * 100 : 0;
  const tlMt10 = tongMt10 > 0 ? (tongThucHien / tongMt10) * 100 : 0;

  // ── YTD vs Kế hoạch năm ────────────────────────────────────────────────────
  const calNow = new Date();
  const calMonthIdx = calNow.getMonth(); // 0-based, April = 3
  const ytdDayOfMonth  = calNow.getDate();
  const ytdDaysInMonth = new Date(calNow.getFullYear(), calNow.getMonth() + 1, 0).getDate();

  // Chỉ lấy tháng từ T1 đến tháng hiện tại, có data thực tế (hn+hcm > 0)
  const ytdMonthsData = MONTHLY_DATA.filter((m, i) =>
    i <= calMonthIdx && m.hn != null && (m.hn + (m.hcm ?? 0)) > 0
  );
  const ytdMonths = ytdMonthsData.length;
  // Kiểm tra tháng cuối có data có phải tháng đang chạy không
  const lastDataIdx = MONTHLY_DATA.findIndex((m, i) =>
    i === calMonthIdx && m.hn != null && (m.hn + (m.hcm ?? 0)) > 0
  );
  const lastDataIsCurrentMonth = lastDataIdx === calMonthIdx && ytdMonths > 0;
  const ytdPaceRatio = lastDataIsCurrentMonth && ytdDayOfMonth < ytdDaysInMonth
    ? ytdDayOfMonth / ytdDaysInMonth : 1;

  // Raw sum — dùng cho YoY và "cần đạt" (không inflate)
  const ytdActualRaw = ytdMonthsData.reduce((s, m) => s + (m.hn ?? 0) + (m.hcm ?? 0), 0);
  // Pace-project tháng hiện tại → full-month equivalent cho forecast
  const lastMonthRaw = ytdMonths > 0
    ? (ytdMonthsData[ytdMonths - 1].hn ?? 0) + (ytdMonthsData[ytdMonths - 1].hcm ?? 0) : 0;
  const lastMonthProj = lastDataIsCurrentMonth && ytdPaceRatio < 1
    ? lastMonthRaw / ytdPaceRatio : lastMonthRaw;
  const ytdActual = ytdActualRaw - lastMonthRaw + lastMonthProj; // used for forecast/rates

  // Annual targets
  const annualTarget10 = MONTHLY_DATA.reduce((s, m) => s + (m.mt10 ?? 0), 0);
  const annualTarget8  = MONTHLY_DATA.reduce((s, m) => s + (m.mt8  ?? 0), 0);
  // Period target (same months as YTD)
  const ytdTarget10 = ytdMonthsData.reduce((s, m) => s + (m.mt10 ?? 0), 0);

  // Rates (dùng ytdActual = pace-projected)
  const ytdVsAnnual10 = annualTarget10 > 0 ? ytdActual / annualTarget10 * 100 : 0;
  const ytdVsPeriod10 = ytdTarget10    > 0 ? ytdActual / ytdTarget10    * 100 : 0;

  // Full-year forecast tại tốc độ hiện tại
  const effectiveMonths = lastDataIsCurrentMonth && ytdPaceRatio < 1
    ? (ytdMonths - 1) + ytdPaceRatio : ytdMonths;
  const avgPerMonth    = effectiveMonths > 0 ? ytdActualRaw / effectiveMonths : 0;
  const annualForecast = avgPerMonth * 12;
  const annualForecastPct = annualTarget10 > 0 ? annualForecast / annualTarget10 * 100 : 0;

  // Số tháng còn lại = tháng chưa hoàn thành
  // Nếu đang giữa tháng hiện tại: còn (1-pace) của tháng này + các tháng sau
  const remainMonths = lastDataIsCurrentMonth && ytdPaceRatio < 1
    ? (1 - ytdPaceRatio) + (12 - ytdMonths)   // phần còn lại T_hiện_tại + T sau
    : 12 - ytdMonths;
  // deficit tính từ ytdActualRaw (actual đã có), trừ dần phần còn lại
  const deficit10      = annualTarget10 - ytdActualRaw;
  const neededPerMonth = remainMonths > 0.01 ? deficit10 / remainMonths : null;

  // YoY — so sánh CÙNG KỲ thực: raw T1-T3 full + T4 theo số ngày thực tế
  // CK 2025: cũng chỉ tính tương ứng — tháng partial thì nhân pace ratio
  const ytdPrev = ytdMonthsData.reduce((s, m, i) => {
    const isLast = i === ytdMonths - 1;
    const ck = m.cumKy ?? 0;
    return s + (isLast && lastDataIsCurrentMonth && ytdPaceRatio < 1 ? ck * ytdPaceRatio : ck);
  }, 0);
  const ytdYoy = ytdPrev > 0 ? (ytdActualRaw - ytdPrev) / ytdPrev * 100 : null;

  return (
    <div>
      <Header title="Tổng Quan">
        <Button variant="ghost" size="sm" onClick={() => setShowHistory(true)}>
          <History size={14} /> Lịch Sử AI
        </Button>
        <Button variant="primary" size="sm" onClick={() => setShowAI(true)}>
          <Sparkles size={14} /> Trợ Lý AI
        </Button>
      </Header>

      <div className="p-6">
        <PageHeader
          title="Tổng Quan Dashboard"
          subtitle={`Xin chào ${userName}. ${lastUpdated ? `Dữ liệu cập nhật lúc: ${new Date(lastUpdated).toLocaleString("vi-VN")}` : "Dữ liệu mới nhất"}`}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Bộ lọc:</span>
            {/* Dropdown Theo Tháng */}
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === "thang" ? null : "thang")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  view === "thang" ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-400 hover:text-white"
                }`}
              >
                {view === "thang" ? MONTHLY_DATA[selectedMonthIdx]?.month : "Theo Tháng"}
                <svg width="10" height="6" viewBox="0 0 10 6" fill="currentColor"><path d="M0 0l5 6 5-6z"/></svg>
              </button>
              {openDropdown === "thang" && (
                <div className="absolute top-full mt-1 right-0 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 p-2 grid grid-cols-4 gap-1 min-w-[160px]">
                  {MONTHLY_DATA.map((m, i) => (
                    <button key={m.month} onClick={() => { setView("thang"); setSelectedMonthIdx(i); setOpenDropdown(null); }}
                      className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        view === "thang" && selectedMonthIdx === i ? "bg-blue-500 text-white" : "text-slate-400 hover:text-white hover:bg-slate-700"
                      } ${m.hn == null ? "opacity-40" : ""}`}>
                      {m.month}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dropdown Theo Quý */}
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === "quy" ? null : "quy")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  view === "quy" ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-400 hover:text-white"
                }`}
              >
                {view === "quy" ? `Q${selectedQuarter}` : "Theo Quý"}
                <svg width="10" height="6" viewBox="0 0 10 6" fill="currentColor"><path d="M0 0l5 6 5-6z"/></svg>
              </button>
              {openDropdown === "quy" && (
                <div className="absolute top-full mt-1 right-0 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 p-2 flex flex-col gap-1 min-w-[100px]">
                  {[1, 2, 3, 4].map((q) => (
                    <button key={q} onClick={() => { setView("quy"); setSelectedQuarter(q); setOpenDropdown(null); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors text-left ${
                        view === "quy" && selectedQuarter === q ? "bg-blue-500 text-white" : "text-slate-400 hover:text-white hover:bg-slate-700"
                      } ${QUARTERLY_DATA[q-1]?.nam2026 == null ? "opacity-40" : ""}`}>
                      Quý {q} {QUARTERLY_DATA[q-1]?.nam2026 == null ? "(chưa có)" : ""}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </PageHeader>

        {/* ── YTD vs Kế hoạch năm ── */}
        {ytdMonths > 0 && annualTarget10 > 0 && (() => {
          const borderCls = ytdVsPeriod10 >= 90 ? "border-green-500/50" : ytdVsPeriod10 >= 75 ? "border-amber-500/50" : "border-red-500/50";
          const accentCls = ytdVsPeriod10 >= 90 ? "text-green-400" : ytdVsPeriod10 >= 75 ? "text-amber-400" : "text-red-400";
          const barColor  = ytdVsPeriod10 >= 90 ? "#22c55e" : ytdVsPeriod10 >= 75 ? "#f59e0b" : "#ef4444";
          const fcColor   = annualForecastPct >= 100 ? "text-green-400" : annualForecastPct >= 90 ? "text-amber-400" : "text-red-400";
          const needColor = neededPerMonth == null ? "text-slate-400" : neededPerMonth <= avgPerMonth * 1.1 ? "text-green-400" : neededPerMonth <= avgPerMonth * 1.3 ? "text-amber-400" : "text-red-400";
          const expectedPct = ytdMonths / 12 * 100; // where the "should-be" marker sits
          return (
            <div className={`mb-5 rounded-xl border-2 ${borderCls} bg-slate-800/50 p-4`}>
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm font-bold text-white">Tiến Độ Năm 2026 — YTD vs Kế Hoạch</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {ytdMonths > 0 ? `T1–T${ytdMonths} có dữ liệu` : "Chưa có dữ liệu"}
                    {lastDataIsCurrentMonth && ytdPaceRatio < 1 && (
                      <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300">
                        ⏱ T{calMonthIdx+1} tính pace {ytdDayOfMonth}/{ytdDaysInMonth} ngày
                      </span>
                    )}
                    <span className="ml-2 text-slate-500">· {Math.round(remainMonths)} tháng còn lại</span>
                  </div>
                </div>
                <div className={`text-2xl font-black tabular-nums ${accentCls}`}>
                  {ytdVsPeriod10.toFixed(1)}%
                  <div className="text-[10px] font-normal text-slate-400 text-right">vs kỳ vọng kỳ này</div>
                </div>
              </div>

              {/* 4 metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {/* 1. YTD actual */}
                <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 px-3 py-2.5">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">YTD Thực Hiện</div>
                  <div className="text-lg font-bold text-blue-400 tabular-nums">{ytdActual.toFixed(2)} tỷ</div>
                  {ytdYoy !== null && (
                    <div className={`text-[11px] mt-0.5 font-semibold ${ytdYoy >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {ytdYoy >= 0 ? "▲" : "▼"}{Math.abs(ytdYoy).toFixed(1)}% so CK 2025
                    </div>
                  )}
                </div>
                {/* 2. vs Annual plan */}
                <div className={`rounded-lg px-3 py-2.5 ${thresholdColor(ytdVsAnnual10).bg} border ${thresholdColor(ytdVsAnnual10).border}`}>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">vs Kế Hoạch Năm MT10%</div>
                  <div className={`text-lg font-bold tabular-nums ${thresholdColor(ytdVsAnnual10).text}`}>{ytdVsAnnual10.toFixed(1)}%</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">KH năm: {annualTarget10.toFixed(2)} tỷ</div>
                </div>
                {/* 3. Full-year forecast */}
                <div className="rounded-lg bg-slate-700/40 border border-slate-600/40 px-3 py-2.5">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Dự Báo Cả Năm</div>
                  <div className={`text-lg font-bold tabular-nums ${fcColor}`}>{annualForecast.toFixed(2)} tỷ</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">= {annualForecastPct.toFixed(0)}% kế hoạch · TB {avgPerMonth.toFixed(2)}tỷ/T</div>
                </div>
                {/* 4. Needed per remaining month */}
                <div className="rounded-lg bg-slate-700/40 border border-slate-600/40 px-3 py-2.5">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">
                    Cần Đạt / Tháng Còn Lại {remainMonths > 0 ? `(~${remainMonths.toFixed(1)}T)` : ""}
                  </div>
                  {neededPerMonth != null ? (
                    <>
                      <div className={`text-lg font-bold tabular-nums ${needColor}`}>{neededPerMonth.toFixed(2)} tỷ</div>
                      <div className={`text-[11px] mt-0.5 ${neededPerMonth > avgPerMonth ? "text-red-400" : "text-slate-500"}`}>
                        {neededPerMonth > avgPerMonth
                          ? `▲ ${((neededPerMonth/avgPerMonth - 1)*100).toFixed(0)}% so TB ${avgPerMonth.toFixed(2)} tỷ/T`
                          : `TB hiện tại: ${avgPerMonth.toFixed(2)} tỷ/T ✓`}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-lg font-bold text-slate-400">—</div>
                      <div className="text-[11px] mt-0.5 text-slate-500">Đã hết năm</div>
                    </>
                  )}
                </div>
              </div>

              {/* Progress bar + month markers */}
              <div>
                <div className="flex items-center justify-between mb-1.5 text-[11px]">
                  <span className="text-slate-400">Hoàn thành kế hoạch năm MT10% ({annualTarget10.toFixed(2)} tỷ)</span>
                  <span className={`font-bold ${accentCls}`}>{ytdVsAnnual10.toFixed(1)}%</span>
                </div>
                <div className="relative h-2.5 bg-slate-700 rounded-full overflow-visible mb-2">
                  {/* Actual progress */}
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(ytdVsAnnual10, 100)}%`, backgroundColor: barColor }} />
                  {/* Expected-pace marker (where we "should" be) */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-white/50 rounded-full"
                    style={{ left: `${Math.min(expectedPct, 99.5)}%` }}
                    title={`Kỳ vọng tại ${ytdMonths}T: ${expectedPct.toFixed(0)}%`}
                  />
                </div>
                {/* Month tick marks */}
                <div className="flex gap-0">
                  {Array.from({ length: 12 }, (_, i) => {
                    const m = MONTHLY_DATA[i];
                    const hasData = i < ytdMonths && m?.hn != null && (m.hn + (m.hcm ?? 0)) > 0;
                    const isCur   = i === calMonthIdx && lastDataIsCurrentMonth;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center">
                        <div className={`h-1 w-full rounded-sm ${
                          hasData && !isCur ? "bg-blue-400/70" :
                          isCur ? "bg-amber-400/70" :
                          "bg-slate-700"
                        }`} />
                        <div className="text-[8px] text-slate-600 mt-0.5 hidden md:block">
                          {MONTHLY_DATA[i]?.month ?? `T${i+1}`}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-4 mt-1.5 text-[10px] text-slate-500">
                  <span><span className="inline-block w-2 h-1 rounded bg-blue-400/70 mr-1"/>Đã có dữ liệu</span>
                  {lastDataIsCurrentMonth && ytdPaceRatio < 1 && <span><span className="inline-block w-2 h-1 rounded bg-amber-400/70 mr-1"/>Tháng hiện tại (pace)</span>}
                  <span><span className="inline-block w-0.5 h-3 rounded bg-white/50 mr-1 align-middle"/>Kỳ vọng tại T{ytdMonths}</span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── Summary KPI strip ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {view === "thang" ? (() => {
            const c8  = thresholdColor(selTlMt8);
            const c10 = thresholdColor(selTlMt10);
            return [
              <div key="thuc-hien" className="bg-slate-800/60 rounded-xl border border-blue-500/30 bg-blue-500/5 p-4">
                <div className="text-xs text-slate-400 mb-1">Thực hiện {selMonth?.month}</div>
                <div className="text-xl font-bold text-blue-400">{selThucHien.toFixed(2)} tỷ</div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-xs text-slate-500 shrink-0">Toàn Quốc</span>
                  {prevThucHien > 0 && <TrendBadge pct={trendThang} label={`so ${prevMonth?.month ?? "T trước"}`} />}
                  {selMonth?.cumKy != null && selMonth.cumKy > 0 && (
                    <TrendBadge pct={(selThucHien - selMonth.cumKy) / selMonth.cumKy * 100} label="CK 2025" />
                  )}
                </div>
              </div>,
              <div key="mt8" className={`rounded-xl border p-4 ${c8.border} ${c8.bg}`}>
                <div className="text-xs text-slate-400 mb-1">Mục tiêu 8% {selMonth?.month}</div>
                <div className={`text-xl font-bold ${c8.text}`}>{(selMonth?.mt8 ?? 0).toFixed(2)} tỷ</div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${c8.badge}`}>Đạt {selTlMt8.toFixed(1)}%</span>
                </div>
              </div>,
              <div key="mt10" className={`rounded-xl border p-4 ${c10.border} ${c10.bg}`}>
                <div className="text-xs text-slate-400 mb-1">Mục tiêu 10% {selMonth?.month}</div>
                <div className={`text-xl font-bold ${c10.text}`}>{(selMonth?.mt10 ?? 0).toFixed(2)} tỷ</div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${c10.badge}`}>Đạt {selTlMt10.toFixed(1)}%</span>
                </div>
              </div>,
              <div key="hn-hcm" className="bg-slate-800/60 rounded-xl border border-slate-500/20 p-4">
                <div className="text-xs text-slate-400 mb-1">Tỉ trọng HN và HCM</div>
                <div className="text-lg font-bold text-slate-300">
                  <span className="text-blue-400">{(selMonth?.hn ?? 0).toFixed(2)}</span>
                  <span className="text-slate-500 text-sm font-normal"> tỷ</span>
                  <span className="text-slate-500 mx-1">/</span>
                  <span className="text-orange-400">{(selMonth?.hcm ?? 0).toFixed(2)}</span>
                  <span className="text-slate-500 text-sm font-normal"> tỷ</span>
                </div>
                <div className="text-xs text-slate-500 mt-1.5">
                  {selThucHien > 0
                    ? <><span className="text-blue-400 font-medium">HN {((selMonth?.hn??0)/selThucHien*100).toFixed(0)}%</span> · <span className="text-orange-400 font-medium">HCM {((selMonth?.hcm??0)/selThucHien*100).toFixed(0)}%</span></>
                    : "tỷ VNĐ"}
                </div>
              </div>,
            ];
          })() : (() => {
            const c8  = thresholdColor(tlMt8);
            const c10 = thresholdColor(tlMt10);
            const trendQuy = selQuy?.tangTruong ?? 0;
            const hnQuy  = qMonths.reduce((s, m) => s + (m.hn  ?? 0), 0);
            const hcmQuy = qMonths.reduce((s, m) => s + (m.hcm ?? 0), 0);
            const hnQuyShare  = tongThucHien > 0 ? Math.round(hnQuy  / tongThucHien * 100) : 0;
            const hcmQuyShare = tongThucHien > 0 ? Math.round(hcmQuy / tongThucHien * 100) : 0;
            const prevQStart  = (selectedQuarter - 2) * 3;
            const prevQMonths = selectedQuarter > 1 ? MONTHLY_DATA.slice(prevQStart, prevQStart + 3) : [];
            const prevQTotal  = prevQMonths.reduce((s, m) => s + (m.hn ?? 0) + (m.hcm ?? 0), 0);
            const qMom        = prevQTotal > 0 ? (tongThucHien - prevQTotal) / prevQTotal * 100 : null;
            return [
              <div key="thuc-hien-q" className="bg-slate-800/60 rounded-xl border border-blue-500/30 bg-blue-500/5 p-4">
                <div className="text-xs text-slate-400 mb-1">Thực hiện Q{selectedQuarter}</div>
                <div className="text-xl font-bold text-blue-400">{tongThucHien.toFixed(2)} tỷ</div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-xs text-slate-500 shrink-0">Toàn Quốc</span>
                  {qMom !== null && <TrendBadge pct={qMom} label={`so Q${selectedQuarter - 1}`} />}
                  {trendQuy > 0 && <TrendBadge pct={trendQuy - 100} label="CK 2025" />}
                </div>
              </div>,
              <div key="mt8-q" className={`rounded-xl border p-4 ${c8.border} ${c8.bg}`}>
                <div className="text-xs text-slate-400 mb-1">Mục tiêu 8% Q{selectedQuarter}</div>
                <div className={`text-xl font-bold ${c8.text}`}>{tongMt8.toFixed(2)} tỷ</div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${c8.badge}`}>Đạt {tlMt8.toFixed(1)}%</span>
                </div>
              </div>,
              <div key="mt10-q" className={`rounded-xl border p-4 ${c10.border} ${c10.bg}`}>
                <div className="text-xs text-slate-400 mb-1">Mục tiêu 10% Q{selectedQuarter}</div>
                <div className={`text-xl font-bold ${c10.text}`}>{tongMt10.toFixed(2)} tỷ</div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${c10.badge}`}>Đạt {tlMt10.toFixed(1)}%</span>
                </div>
              </div>,
              <div key="hn-hcm-q" className="bg-slate-800/60 rounded-xl border border-slate-500/20 p-4">
                <div className="text-xs text-slate-400 mb-1">Tỉ trọng HN và HCM</div>
                <div className="text-lg font-bold text-slate-300">
                  <span className="text-blue-400">{hnQuy.toFixed(2)}</span>
                  <span className="text-slate-500 text-sm font-normal"> tỷ</span>
                  <span className="text-slate-500 mx-1">/</span>
                  <span className="text-orange-400">{hcmQuy.toFixed(2)}</span>
                  <span className="text-slate-500 text-sm font-normal"> tỷ</span>
                </div>
                <div className="text-xs text-slate-500 mt-1.5">
                  {tongThucHien > 0
                    ? <><span className="text-blue-400 font-medium">HN {hnQuyShare}%</span> · <span className="text-orange-400 font-medium">HCM {hcmQuyShare}%</span></>
                    : "tỷ VNĐ"}
                </div>
              </div>,
            ];
          })()}
        </div>

        {/* ── CHART 1: THEO THÁNG ── */}
        {view === "thang" && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Kết Quả & Mục Tiêu Hàng Tháng (tỷ VNĐ)</CardTitle>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1.5 text-xs text-blue-400"><span className="w-3 h-3 rounded-sm bg-blue-600 inline-block" />HN</span>
                <span className="flex items-center gap-1.5 text-xs text-cyan-400"><span className="w-3 h-3 rounded-sm bg-cyan-500 inline-block" />HCM</span>
                {/* Kết quả 2025: nét liền mảnh, xám */}
                <span className="flex items-center gap-1.5 text-xs text-slate-300">
                  <svg width="20" height="10"><line x1="0" y1="5" x2="20" y2="5" stroke="#94a3b8" strokeWidth="2"/><circle cx="10" cy="5" r="2.5" fill="#94a3b8"/></svg>
                  KQ 2025
                </span>
                {/* MT 10%: chấm bi, xanh lá */}
                <span className="flex items-center gap-1.5 text-xs text-green-400">
                  <svg width="20" height="10"><line x1="0" y1="5" x2="20" y2="5" stroke="#10B981" strokeWidth="2.5" strokeDasharray="2 3"/><polygon points="10,1 13,9 7,9" fill="#10B981"/></svg>
                  MT 10%
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={MONTHLY_DATA} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}`} />
                  <Tooltip {...TOOLTIP_STYLE} formatter={fmtTip} />
                  {/* Stacked bars: HN + HCM */}
                  <Bar dataKey="hn" name="hn" stackId="kq" fill="#2563eb" radius={[0,0,0,0]} maxBarSize={32}>
                    <LabelList content={(props: any) => {
                      const { x, y, width, height, value, index } = props;
                      const m = MONTHLY_DATA[index];
                      if (!m || m.hn == null || height < 18) return null;
                      const total = (m.hn ?? 0) + (m.hcm ?? 0);
                      const pct = total > 0 ? ((value / total) * 100).toFixed(0) : "0";
                      return (
                        <text x={x + width / 2} y={y + height / 2} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={10} fontWeight={600}>
                          HN {pct}%
                        </text>
                      );
                    }} />
                  </Bar>
                  <Bar dataKey="hcm" name="hcm" stackId="kq" fill="#06b6d4" radius={[4,4,0,0]} maxBarSize={32}>
                    <LabelList content={(props: any) => {
                      const { x, y, width, height, value, index } = props;
                      const m = MONTHLY_DATA[index];
                      if (!m || m.hn == null) return null;
                      // value trong recharts stacked = tổng cộng (hn+hcm), không phải riêng hcm
                      const total = value ?? 0;
                      const hcmVal = m.hcm ?? 0;
                      const hcmPct = total > 0 ? ((hcmVal / total) * 100).toFixed(0) : "0";
                      const achPct = m.mt10 > 0 ? ((total / m.mt10) * 100).toFixed(0) : "0";
                      const achColor = total >= m.mt10 ? "#4ade80" : total >= m.mt8 ? "#fbbf24" : "#f87171";
                      return (
                        <g>
                          {/* HCM % trong cột */}
                          {height >= 18 && (
                            <text x={x + width / 2} y={y + height / 2} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={10} fontWeight={600}>
                              HCM {hcmPct}%
                            </text>
                          )}
                          {/* Tổng % đạt MT10% trên đỉnh */}
                          <text x={x + width / 2} y={y - 7} textAnchor="middle" dominantBaseline="auto" fill={achColor} fontSize={11} fontWeight={700}>
                            {achPct}%
                          </text>
                        </g>
                      );
                    }} />
                  </Bar>
                  {/* KQ 2025: nét liền, xám, dot tròn nhỏ */}
                  <Line type="monotone" dataKey="cumKy" name="cumKy" stroke="#94a3b8" strokeWidth={2} dot={{ fill: "#94a3b8", r: 3, strokeWidth: 0 }} />
                  {/* MT 10%: chấm bi (2 3), xanh lá */}
                  <Line type="monotone" dataKey="mt10"  name="mt10"  stroke="#10B981" strokeWidth={2.5} strokeDasharray="2 3" dot={{ fill: "#10B981", r: 4, strokeWidth: 0 }} />
                </ComposedChart>
              </ResponsiveContainer>

              {/* Monthly table summary */}
              <div className="mt-5 overflow-x-auto rounded-xl border border-slate-700/50">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-800/80">
                      <td className="py-2.5 px-3 font-semibold text-slate-400 border-b border-slate-700/60 min-w-[140px]">Thông tin</td>
                      {MONTHLY_DATA.map(m => (
                        <td key={m.month} className="py-2.5 px-2 text-right font-semibold text-slate-400 border-b border-slate-700/60 min-w-[48px]">{m.month}</td>
                      ))}
                      <td className="py-2.5 px-3 text-right font-bold text-red-400 border-b border-slate-700/60">Tổng</td>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: "Kết quả 2025",    key: "cumKy", textColor: "text-slate-200",  bg: "bg-slate-700/30",  totalColor: "text-slate-200",  border: "border-slate-600/40" },
                      { label: "Mục tiêu 8%",      key: "mt8",   textColor: "text-amber-300",  bg: "bg-amber-500/10",  totalColor: "text-amber-400",  border: "border-amber-500/20" },
                      { label: "Mục tiêu 10%",     key: "mt10",  textColor: "text-green-300",  bg: "bg-green-500/10",  totalColor: "text-green-400",  border: "border-green-500/20" },
                      { label: "Kết quả (HN+HCM)", key: "total", textColor: "text-blue-200",   bg: "bg-blue-500/15",   totalColor: "text-blue-400",   border: "border-blue-500/20"  },
                    ].map((row, ri) => {
                      const vals = MONTHLY_DATA.map(m =>
                        row.key === "total"
                          ? (m.hn != null && m.hcm != null ? +(m.hn + m.hcm).toFixed(2) : null)
                          : (m as any)[row.key] as number
                      );
                      const total = vals.reduce((s: number, v) => s + (v ?? 0), 0);
                      return (
                        <tr key={row.label} className={`${row.bg} border-b ${row.border}`}>
                          <td className={`py-2 px-3 font-semibold ${row.textColor}`}>{row.label}</td>
                          {vals.map((v, i) => (
                            <td key={i} className={`py-2 px-2 text-right tabular-nums ${v != null ? row.textColor : "text-slate-700"}`}>
                              {v != null ? v.toFixed(2) : "—"}
                            </td>
                          ))}
                          <td className={`py-2 px-3 text-right font-bold tabular-nums ${row.totalColor}`}>
                            {total.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── CHART 2: THEO QUÝ ── */}
        {view === "quy" && (() => {
          // Tính dữ liệu quý từ monthly_data
          const qChartData = [1,2,3,4].map(q => {
            const qMs = MONTHLY_DATA.slice((q-1)*3, q*3);
            const hasPrev   = qMs.some(m => (m as any).hnPrev != null);
            const has2026   = qMs.some(m => m.hn != null);
            const hn2025    = hasPrev  ? qMs.reduce((s,m) => s+((m as any).hnPrev??0), 0) : null;
            const hcm2025   = hasPrev  ? qMs.reduce((s,m) => s+((m as any).hcmPrev??0), 0) : null;
            const nam2025fb = !hasPrev ? (qMs.reduce((s,m) => s+(m.cumKy??0), 0) || null) : null;
            const hn2026    = has2026  ? qMs.reduce((s,m) => s+(m.hn??0), 0) : null;
            const hcm2026   = has2026  ? qMs.reduce((s,m) => s+(m.hcm??0), 0) : null;
            const base         = QUARTERLY_DATA[q-1];
            const mt8q         = qMs.reduce((s,m) => s+(m.mt8??0), 0) || base.mt8 || null;
            const mt10q        = qMs.reduce((s,m) => s+(m.mt10??0), 0) || base.mt10 || null;
            const nam2025total = qMs.reduce((s,m) => s+(m.cumKy??0), 0) || null;
            const nam2026total = hn2026 != null ? (hn2026 + (hcm2026??0)) : (base.nam2026 ?? null);
            // Tính động: % vs MT và tăng trưởng dựa trên dữ liệu thực tế
            const tlMt8  = (nam2026total != null && mt8q  && mt8q  > 0) ? (nam2026total / mt8q  * 100) : (base.tlMt8  || null);
            const tlMt10 = (nam2026total != null && mt10q && mt10q > 0) ? (nam2026total / mt10q * 100) : (base.tlMt10 || null);
            const tangTruong = (nam2026total != null && nam2025total && nam2025total > 0)
              ? (nam2026total / nam2025total * 100)
              : (base.tangTruong || null);
            return { quy: `Q${q}`, hn2025, hcm2025, nam2025: nam2025fb, hn2026, hcm2026,
                     nam2025total, nam2026total, mt8: mt8q, mt10: mt10q,
                     tlMt8, tlMt10, tangTruong };
          });
          return (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Kết Quả & Mục Tiêu Theo Quý (tỷ VNĐ)</CardTitle>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-slate-500 inline-block opacity-70" />
                  <span className="w-2.5 h-2.5 rounded-sm bg-slate-400 inline-block opacity-50 -ml-1" />
                  HN / HCM 2025
                </span>
                <span className="flex items-center gap-1 text-xs text-blue-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-600 inline-block" />
                  <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500 inline-block -ml-1" />
                  HN / HCM 2026
                </span>
                <span className="flex items-center gap-1.5 text-xs text-green-400"><span className="w-5 border-t-2 border-dashed border-green-400 inline-block" />MT 10%</span>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={qChartData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="quy" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip {...TOOLTIP_STYLE} formatter={fmtTip} />
                  {/* 2025 — fallback single bar khi chưa có hn/hcm split */}
                  <Bar dataKey="nam2025" name="nam2025" stackId="a" fill="#475569" radius={[4,4,0,0]} maxBarSize={36} opacity={0.7} />
                  {/* 2025 — stacked HN + HCM khi có hnPrev */}
                  <Bar dataKey="hn2025"  name="hn2025"  stackId="a" fill="#334155" maxBarSize={36} opacity={0.85} />
                  <Bar dataKey="hcm2025" name="hcm2025" stackId="a" fill="#57534e" radius={[4,4,0,0]} maxBarSize={36} opacity={0.85} />
                  {/* 2026 — stacked HN + HCM */}
                  <Bar dataKey="hn2026"  name="hn2026"  stackId="b" fill="#2563eb" maxBarSize={36} />
                  <Bar dataKey="hcm2026" name="hcm2026" stackId="b" fill="#0891b2" radius={[4,4,0,0]} maxBarSize={36} />
                  <Line type="monotone" dataKey="mt10" name="mt10" stroke="#10B981" strokeWidth={2} strokeDasharray="5 4" dot={{ fill: "#10B981", r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>

              {/* Quarterly achievement table */}
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-700/50">
                      <td className="py-2 pr-4">Chỉ tiêu</td>
                      {qChartData.map(q => <td key={q.quy} className="py-2 px-3 text-center">{q.quy}</td>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {([
                      { label: "KQ 2025",      key: "nam2025total", color: "text-slate-400" },
                      { label: "KQ 2026",      key: "nam2026total", color: "text-blue-400"  },
                      { label: "HN 2025",      key: "hn2025",       color: "text-slate-500" },
                      { label: "HCM 2025",     key: "hcm2025",      color: "text-stone-400" },
                      { label: "HN 2026",      key: "hn2026",       color: "text-blue-400"  },
                      { label: "HCM 2026",     key: "hcm2026",      color: "text-cyan-400"  },
                      { label: "Mục tiêu 10%", key: "mt10",         color: "text-green-400" },
                      { label: "% vs MT 10%",  key: "tlMt10",       color: "text-green-400", isRate: true },
                      { label: "Tăng trưởng",  key: "tangTruong",   color: "text-cyan-400",  isRate: true },
                    ] as { label: string; key: string; color: string; isRate?: boolean }[]).map(row => (
                      <tr key={row.label}>
                        <td className={`py-1.5 pr-4 font-medium ${row.color}`}>{row.label}</td>
                        {qChartData.map(q => {
                          const v = (q as any)[row.key];
                          if (v == null || v === 0 && row.isRate) return <td key={q.quy} className="py-1.5 px-3 text-center text-slate-700">—</td>;
                          if (row.isRate) {
                            const isGood = v >= 100;
                            return <td key={q.quy} className={`py-1.5 px-3 text-center font-semibold ${isGood ? "text-green-400" : "text-amber-400"}`}>{v.toFixed(2)}%</td>;
                          }
                          return <td key={q.quy} className="py-1.5 px-3 text-center text-slate-300">{(v as number).toFixed(2)}</td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          );
        })()}

        {/* ── CHART: Doanh số chi tiết so sánh 2025 vs 2026 ── */}
        {(() => {
          const totalDk25  = REVENUE_TYPE.reduce((s, r) => s + r.prev_dk, 0);
          const totalGh25  = REVENUE_TYPE.reduce((s, r) => s + r.prev_gh, 0);
          const tlDkMoi25  = totalDk25 + totalGh25 > 0 ? ((totalDk25 / (totalDk25 + totalGh25)) * 100).toFixed(1) : "0";
          const totalDk26  = REVENUE_TYPE.reduce((s, r) => s + r.dangKyMoi, 0);
          const totalGh26  = REVENUE_TYPE.reduce((s, r) => s + r.giaHan, 0);
          const tlDkMoi26  = totalDk26 + totalGh26 > 0 ? ((totalDk26 / (totalDk26 + totalGh26)) * 100).toFixed(1) : "0";
          return (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Doanh Số Chi Tiết Theo Tháng — So Sánh 2025 vs 2026 (tỷ VNĐ)</CardTitle>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1.5 text-xs text-sky-400"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{background:"#0ea5e9"}} />ĐK Mới 2026</span>
              <span className="flex items-center gap-1.5 text-xs text-purple-400"><span className="w-2.5 h-2.5 rounded-sm inline-block" style={{background:"#a855f7"}} />Gia Hạn 2026</span>
              <span className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-2.5 h-2.5 rounded-sm inline-block opacity-60" style={{background:"#4ade80"}} />ĐK Mới 2025</span>
              <span className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-2.5 h-2.5 rounded-sm inline-block opacity-60" style={{background:"#facc15"}} />Gia Hạn 2025</span>
              <span className="ml-auto flex items-center gap-4">
                <span className="text-xs text-slate-400">
                  Tỉ lệ ĐK Mới TB <span className="text-green-400 font-semibold">2025: {tlDkMoi25}%</span>
                </span>
                {totalDk26 + totalGh26 > 0 && (
                  <span className="text-xs text-slate-400">
                    <span className="text-sky-400 font-semibold">2026: {tlDkMoi26}%</span>
                  </span>
                )}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={REVENUE_TYPE} margin={{ top: 28, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP_STYLE}
                  formatter={(v: any, name: any) => {
                    const m: Record<string, string> = { dangKyMoi: "ĐK Mới 2026", giaHan: "Gia Hạn 2026", prev_dk: "ĐK Mới 2025", prev_gh: "Gia Hạn 2025" };
                    return [`${Number(v).toFixed(3)} tỷ`, m[String(name)] ?? name] as [string, string];
                  }}
                />
                {/* 2025 — ĐK Mới (xanh lá nhạt mờ) */}
                <Bar dataKey="prev_dk" name="prev_dk" stackId="prev" fill="#4ade80" opacity={0.55} maxBarSize={36}>
                  <LabelList dataKey="prev_dk" content={(props: any) => {
                    const { x, y, width, height, value, index } = props;
                    if (!height || height < 18) return null;
                    const r = REVENUE_TYPE[index];
                    const total = r.prev_dk + r.prev_gh;
                    const pct = total > 0 ? ((value / total) * 100).toFixed(0) : "0";
                    return (
                      <text x={x + width / 2} y={y + height / 2} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={9} fontWeight={600}>
                        {pct}%
                      </text>
                    );
                  }} />
                </Bar>
                {/* 2025 — Gia Hạn (vàng nhạt mờ) + tổng trên đỉnh */}
                <Bar dataKey="prev_gh" name="prev_gh" stackId="prev" fill="#facc15" opacity={0.55} maxBarSize={36} radius={[3,3,0,0]}>
                  <LabelList dataKey="prev_gh" content={(props: any) => {
                    const { x, y, width, height, value, index } = props;
                    if (!height) return null;
                    const r = REVENUE_TYPE[index];
                    const total = r.prev_dk + r.prev_gh;
                    const pct = total > 0 ? ((value / total) * 100).toFixed(0) : "0";
                    return (
                      <g>
                        {height >= 18 && (
                          <text x={x + width / 2} y={y + height / 2} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={9} fontWeight={600}>
                            {pct}%
                          </text>
                        )}
                        <text x={x + width / 2} y={y - 7} textAnchor="middle" dominantBaseline="auto" fill="#94a3b8" fontSize={10} fontWeight={600}>
                          {total.toFixed(2)}
                        </text>
                      </g>
                    );
                  }} />
                </Bar>
                {/* 2026 — ĐK Mới */}
                <Bar dataKey="dangKyMoi" name="dangKyMoi" stackId="curr" fill="#0ea5e9" maxBarSize={36}>
                  <LabelList dataKey="dangKyMoi" content={(props: any) => {
                    const { x, y, width, height, value, index } = props;
                    if (!height || height < 18) return null;
                    const r = REVENUE_TYPE[index];
                    const total = r.dangKyMoi + r.giaHan;
                    if (!total) return null;
                    const pct = ((value / total) * 100).toFixed(0);
                    return (
                      <text x={x + width / 2} y={y + height / 2} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={9} fontWeight={600}>
                        {pct}%
                      </text>
                    );
                  }} />
                </Bar>
                {/* 2026 — Gia Hạn + tổng trên đỉnh */}
                <Bar dataKey="giaHan" name="giaHan" stackId="curr" fill="#a855f7" maxBarSize={36} radius={[3,3,0,0]}>
                  <LabelList dataKey="giaHan" content={(props: any) => {
                    const { x, y, width, height, value, index } = props;
                    if (!height) return null;
                    const r = REVENUE_TYPE[index];
                    const total = r.dangKyMoi + r.giaHan;
                    if (!total) return null;
                    const pct = ((value / total) * 100).toFixed(0);
                    return (
                      <g>
                        {height >= 18 && (
                          <text x={x + width / 2} y={y + height / 2} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={9} fontWeight={600}>
                            {pct}%
                          </text>
                        )}
                        <text x={x + width / 2} y={y - 7} textAnchor="middle" dominantBaseline="auto" fill="#e2e8f0" fontSize={11} fontWeight={700}>
                          {total.toFixed(2)}
                        </text>
                      </g>
                    );
                  }} />
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>

            {/* Bảng tóm tắt */}
            <div className="mt-4 overflow-x-auto rounded-lg border border-slate-700/50">
              <table className="w-full text-xs border-collapse">
                {(() => {
                  const rows = [
                    { label: "ĐK Mới Tổng", key: "dangKyMoi", prevKey: "prev_dk",    color: "text-sky-300",    bg: "bg-sky-500/10",    border: "border-sky-500/20",    lb: "border-l-2 border-sky-400",    bold: true },
                    { label: "— HN",          key: "dkHn",      prevKey: "prev_dkHn",  color: "text-sky-400",    bg: "bg-sky-500/5",     border: "border-sky-500/10",    lb: "border-l-2 border-sky-600 pl-5", bold: false },
                    { label: "— HCM",         key: "dkHcm",     prevKey: "prev_dkHcm", color: "text-cyan-400",   bg: "bg-cyan-500/5",    border: "border-cyan-500/10",   lb: "border-l-2 border-cyan-600 pl-5", bold: false },
                    { label: "Gia Hạn Tổng", key: "giaHan",    prevKey: "prev_gh",    color: "text-purple-300", bg: "bg-purple-500/10", border: "border-purple-500/20", lb: "border-l-2 border-purple-400",  bold: true },
                    { label: "— HN",          key: "ghHn",      prevKey: "prev_ghHn",  color: "text-purple-400", bg: "bg-purple-500/5",  border: "border-purple-500/10", lb: "border-l-2 border-purple-600 pl-5", bold: false },
                    { label: "— HCM",         key: "ghHcm",     prevKey: "prev_ghHcm", color: "text-violet-400", bg: "bg-violet-500/5",  border: "border-violet-500/10", lb: "border-l-2 border-violet-600 pl-5", bold: false },
                  ];
                  const hasPrevHnHcm = REVENUE_TYPE.some(r => ((r as any).prev_dkHn ?? 0) > 0 || ((r as any).prev_ghHn ?? 0) > 0);

                  // Xác định cột: tháng (T1-T12) hoặc quý (Q1-Q4)
                  type Col = { label: string; months: string[] };
                  const QUARTER_MONTHS_MAP: Record<string,string[]> = { Q1:["T1","T2","T3"], Q2:["T4","T5","T6"], Q3:["T7","T8","T9"], Q4:["T10","T11","T12"] };
                  const cols: Col[] = view === "quy"
                    ? ["Q1","Q2","Q3","Q4"].map(q => ({ label: q, months: QUARTER_MONTHS_MAP[q] }))
                    : Array.from({ length: 12 }, (_, i) => ({ label: `T${i+1}`, months: [`T${i+1}`] }));

                  // Helper: sum một row qua nhiều tháng
                  const sumVal = (fieldKey: string, monthLabels: string[]) =>
                    monthLabels.reduce((s, ml) => s + ((REVENUE_TYPE.find(r => r.month === ml) as any)?.[fieldKey] ?? 0), 0);

                  return (
                    <>
                      <thead>
                        <tr className="bg-slate-800/80">
                          <td className="py-2 px-3 font-semibold text-slate-300 border-b border-slate-700/50 min-w-[150px]">Chi tiết Doanh số</td>
                          {cols.map(col => (
                            <td key={col.label} className="py-2 px-3 text-right font-semibold text-slate-400 border-b border-slate-700/50 min-w-[90px]">{col.label}</td>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row) => {
                          const isSubRow = !hasPrevHnHcm && (row.prevKey === "prev_dkHn" || row.prevKey === "prev_dkHcm" || row.prevKey === "prev_ghHn" || row.prevKey === "prev_ghHcm");
                          return (
                            <tr key={`${row.label}-${row.key}`} className={`${row.bg} border-b ${row.border}`}>
                              <td className={`py-2 px-3 ${row.bold ? "font-semibold" : "font-medium"} ${row.color} ${row.lb}`}>{row.label}</td>
                              {cols.map(col => {
                                const val = sumVal(row.key, col.months);
                                const prevVal = isSubRow ? null : sumVal(row.prevKey, col.months);
                                const yoy = (val > 0 && prevVal && prevVal > 0) ? ((val - prevVal) / prevVal * 100) : null;
                                return (
                                  <td key={col.label} className="py-1.5 px-3 text-right tabular-nums">
                                    <div className={`${row.color} ${row.bold ? "font-semibold" : ""}`}>
                                      {val > 0 ? val.toFixed(3) : <span className="text-slate-600">—</span>}
                                    </div>
                                    {yoy !== null && (
                                      <div className={`text-[10px] font-bold mt-0.5 ${yoy >= 0 ? "text-green-400" : "text-red-400"}`}>
                                        {yoy >= 0 ? "▲" : "▼"}{Math.abs(yoy).toFixed(1)}%
                                      </div>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </tbody>
                    </>
                  );
                })()}
              </table>
            </div>
          </CardContent>
        </Card>
          );
        })()}

        {/* ── CHART: Tỉ trọng 6 nhóm dịch vụ ── */}
        <Card className="mb-4">
            <CardHeader>
              <CardTitle>Tỉ Trọng Dịch Vụ Đăng Ký Mới — {svcLabel}</CardTitle>
              <Badge variant="brand">6 nhóm</Badge>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col lg:flex-row gap-4 items-center">
                {/* Donut chart — rộng hơn để label không bị cắt */}
                <div className="flex-shrink-0 w-full lg:w-[420px]">
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
                      <Pie
                        data={svcQ1} cx="50%" cy="50%"
                        innerRadius={75} outerRadius={110}
                        paddingAngle={2} dataKey="value" nameKey="name"
                        label={({ cx, cy, midAngle, outerRadius, percent, name }: any) => {
                          if (percent < 0.02) return null;
                          const RADIAN = Math.PI / 180;
                          const r = outerRadius + 36;
                          const x = cx + r * Math.cos(-midAngle * RADIAN);
                          const y = cy + r * Math.sin(-midAngle * RADIAN);
                          const anchor = x > cx ? "start" : "end";
                          const nameMap: Record<string, string[]> = {
                            "Hosting/Email":      ["Host/Mail"],
                            "MS/GWS":             ["MS/GWS"],
                            "Tên miền + DV khác": ["Tên miền"],
                            "Transfer GWS":       ["Transfer", "GWS"],
                            "Sale AI":            ["Sale AI"],
                            "Elastic":            ["Elastic"],
                          };
                          const lines = nameMap[name] ?? [name];
                          const pct = `${(percent * 100).toFixed(1)}%`;
                          return (
                            <text textAnchor={anchor} fill="#cbd5e1" fontSize={11} fontWeight={600}>
                              {lines.map((line, i) => (
                                <tspan key={i} x={x} dy={i === 0 ? y - (lines.length - 1) * 7 : 14}>{line}</tspan>
                              ))}
                              <tspan x={x} dy={14} fill="#94a3b8" fontSize={10}>{pct}</tspan>
                            </text>
                          );
                        }}
                        labelLine={{ stroke: "#475569", strokeWidth: 1 }}
                      >
                        {svcQ1.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip
                        {...TOOLTIP_STYLE}
                        formatter={(v: any, name: any) => {
                          const pct = ((Number(v) / totalService) * 100).toFixed(1);
                          return [`${Number(v).toLocaleString()}M (${pct}%)`, name] as [string, string];
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Stats bên phải — compact hơn */}
                <div className="flex-1 w-full space-y-1.5">
                  {svcQ1.map((g) => {
                    const pctVal = ((g.value / totalService) * 100);
                    return (
                      <div key={g.name} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/40">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: g.color }} />
                        <span className="text-xs text-slate-300 w-36 flex-shrink-0">{g.name}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-slate-700/60 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pctVal}%`, background: g.color }} />
                        </div>
                        <span className="text-xs font-bold text-white w-20 text-right tabular-nums flex-shrink-0">{g.value.toLocaleString()}M</span>
                        <span className="text-xs font-bold w-11 text-right tabular-nums flex-shrink-0" style={{ color: g.color }}>{pctVal.toFixed(1)}%</span>
                      </div>
                    );
                  })}
                  <div className="border-t border-slate-700/50 pt-2 mt-1 flex justify-between items-center px-3">
                    <span className="text-sm text-slate-400 font-medium">Tổng cộng</span>
                    <span className="text-base text-white font-bold">{totalService.toLocaleString()}M</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

        {/* ── CHART 3: Doanh số theo nhóm dịch vụ ── */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Doanh Số Theo Nhóm Dịch Vụ (Triệu VNĐ)</CardTitle>
            <div className="flex items-center gap-2">
              {(["stacked", "grouped"] as const).map((v) => (
                <button key={v} onClick={() => setSvcView(v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    svcView === v ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-400 hover:text-white"
                  }`}>
                  {v === "stacked" ? "Cộng Dồn Theo Tháng" : "So Sánh Theo Nhóm"}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {/* Legend */}
            <div className="flex flex-wrap gap-3 mb-4">
              {SVC_KEYS.map((s) => (
                <span key={s.key} className="flex items-center gap-1.5 text-xs text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: s.color }} />
                  {s.label}
                </span>
              ))}
            </div>

            {/* Chart: Stacked by month */}
            {svcView === "stacked" && (
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={SERVICE_MONTHLY} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}M`} />
                  <Tooltip {...TOOLTIP_STYLE}
                    formatter={(v: any, name: any) => {
                      const found = SVC_KEYS.find((s) => s.key === name);
                      return [`${Number(v).toFixed(1)}M`, found?.label ?? name] as [string, string];
                    }}
                  />
                  {SVC_KEYS.map((s, i) => (
                    <Bar key={s.key} dataKey={s.key} name={s.key} stackId="svc"
                      fill={s.color} maxBarSize={48}
                      radius={i === SVC_KEYS.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                    />
                  ))}
                </ComposedChart>
              </ResponsiveContainer>
            )}

            {/* Chart: Grouped by service group */}
            {svcView === "grouped" && (
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={svcByGroup} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} interval={0} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}M`} />
                  <Tooltip {...TOOLTIP_STYLE}
                    formatter={(v: any, name: any) => [`${Number(v).toFixed(1)}M`, String(name)] as [string, string]}
                  />
                  <Bar dataKey="T1" name="T1" fill="#3b82f6" radius={[3, 3, 0, 0]} maxBarSize={20} />
                  <Bar dataKey="T2" name="T2" fill="#8b5cf6" radius={[3, 3, 0, 0]} maxBarSize={20} />
                  <Bar dataKey="T3" name="T3" fill="#10b981" radius={[3, 3, 0, 0]} maxBarSize={20} />
                </ComposedChart>
              </ResponsiveContainer>
            )}

            {/* Legend for grouped chart */}
            {svcView === "grouped" && (
              <div className="flex gap-4 mt-2 justify-center">
                {[["T1", "#3b82f6"], ["T2", "#8b5cf6"], ["T3", "#10b981"]].map(([m, c]) => (
                  <span key={m} className="flex items-center gap-1.5 text-xs text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: c }} />
                    {m}
                  </span>
                ))}
              </div>
            )}

          </CardContent>
        </Card>
      </div>

      {showAI && <AiAnalysisPanel context="overview" data={{
        revenueType: REVENUE_TYPE.filter(m => m.dangKyMoi > 0 || m.giaHan > 0),
        serviceMonthly: SERVICE_MONTHLY,
      }} onClose={() => setShowAI(false)} />}
      {showHistory && <AiHistoryPanel onClose={() => setShowHistory(false)} />}
    </div>
  );
}
