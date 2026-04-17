"use client";

import { useState, useMemo } from "react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, PieChart, Pie, Cell, ReferenceLine,
} from "recharts";
import { Header, PageHeader } from "@/components/layout/header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Save, TrendingUp, TrendingDown, Minus, StickyNote } from "lucide-react";
import type { UserRole, SalaryData, SalaryMonthRecord, TeamMonthlyData } from "@/lib/types";

const MONTHS = ["T1","T2","T3","T4","T5","T6","T7","T8","T9","T10","T11","T12"];
const CUR_YEAR = 2026;
const PREV_YEAR = 2025;

// Nhóm team theo loại
function teamType(name: string): "ocean" | "reseller" | "consultant" {
  const n = name.toLowerCase();
  if (n.includes("ocean")) return "ocean";
  if (n.includes("reseller")) return "reseller";
  return "consultant";
}

// Tính doanh số theo tháng từ team_service (triệu VNĐ)
function calcGroupRevenue(teamData: TeamMonthlyData) {
  return Object.fromEntries(
    teamData.map(({ month, teams }) => {
      const total = teams.reduce((s, t) => s + (t.revenue ?? 0), 0);
      const hn    = teams.filter(t => t.region === "HN").reduce((s, t) => s + (t.revenue ?? 0), 0);
      const hcm   = teams.filter(t => t.region === "HCM").reduce((s, t) => s + (t.revenue ?? 0), 0);
      const ocean      = teams.filter(t => teamType(t.teamName) === "ocean").reduce((s, t) => s + (t.revenue ?? 0), 0);
      const reseller   = teams.filter(t => teamType(t.teamName) === "reseller").reduce((s, t) => s + (t.revenue ?? 0), 0);
      const consultant = teams.filter(t => teamType(t.teamName) === "consultant").reduce((s, t) => s + (t.revenue ?? 0), 0);
      return [month, { total, hn, hcm, ocean, reseller, consultant }];
    })
  ) as Record<string, { total: number; hn: number; hcm: number; ocean: number; reseller: number; consultant: number }>;
}

function ratio(salary: number, revenue: number) {
  if (!revenue || revenue === 0) return null;
  return Math.round((salary / revenue) * 1000) / 10; // 1 decimal
}

const TOOLTIP_STYLE = {
  contentStyle: { background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#f1f5f9", fontSize: 12 },
};

const EMPTY_ROW = (): Omit<SalaryMonthRecord, "month" | "year"> => ({
  total: 0, hn: 0, hcm: 0, ocean: 0, reseller: 0, consultant: 0,
});

interface Props {
  role: UserRole;
  monthlyData: any[];
  teamServiceData: TeamMonthlyData;
  teamServicePrev: TeamMonthlyData;
  salaryData: SalaryData;
}

export function FinanceClient({ role, monthlyData, teamServiceData, teamServicePrev, salaryData: initialSalaryData }: Props) {
  const isAdmin = role === "admin";
  const [activeTab, setActiveTab] = useState<"report" | "input">("report");
  const [inputYear, setInputYear] = useState<number>(CUR_YEAR);
  const [pieView, setPieView] = useState<"month" | "quarter" | "year">("month");
  const [pieMonth, setPieMonth] = useState<string>("T3");
  const [pieQuarter, setPieQuarter] = useState<"q1" | "q2" | "q3" | "q4">("q1");
  const [pieYear, setPieYear] = useState<number>(CUR_YEAR);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");

  // Local copy — cập nhật sau mỗi lần save, không phụ thuộc prop
  const [salaryData, setSalaryData] = useState<SalaryData>(initialSalaryData);

  // ── Input form state ────────────────────────────────────────────────────────
  const initRows = (year: number, data: SalaryData) =>
    MONTHS.map((month) => {
      const existing = data.find((r) => r.year === year && r.month === month);
      return { month, year, ...(existing ?? EMPTY_ROW()) };
    });

  const [rows, setRows] = useState<SalaryMonthRecord[]>(() => initRows(CUR_YEAR, initialSalaryData));

  function handleYearChange(y: number) {
    setInputYear(y);
    setRows(initRows(y, salaryData));
  }

  function setCell(monthIdx: number, field: keyof Omit<SalaryMonthRecord, "month" | "year" | "note">, val: string) {
    setRows((prev) => prev.map((r, i) => i === monthIdx ? { ...r, [field]: parseFloat(val) || 0 } : r));
  }

  function setNote(monthIdx: number, val: string) {
    setRows((prev) => prev.map((r, i) => i === monthIdx ? { ...r, note: val } : r));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await fetch("/api/salary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: rows }),
      });
      // Fetch lại dữ liệu mới nhất để local state luôn đúng
      const res = await fetch("/api/salary");
      const json = await res.json();
      const fresh: SalaryData = json.data ?? [];
      setSalaryData(fresh);
      setRows(initRows(inputYear, fresh));
      setSavedMsg("Đã lưu!");
      setTimeout(() => setSavedMsg(""), 2500);
    } finally {
      setSaving(false);
    }
  }

  // ── Revenue maps ────────────────────────────────────────────────────────────
  const revCur  = useMemo(() => calcGroupRevenue(teamServiceData), [teamServiceData]);
  const revPrev = useMemo(() => calcGroupRevenue(teamServicePrev), [teamServicePrev]);

  // Salary maps by year
  const salCur  = useMemo(() => Object.fromEntries(salaryData.filter(r => r.year === CUR_YEAR).map(r => [r.month, r])), [salaryData]);
  const salPrev = useMemo(() => Object.fromEntries(salaryData.filter(r => r.year === PREV_YEAR).map(r => [r.month, r])), [salaryData]);

  // Tháng có ghi chú bất thường (2026)
  const notesByMonth = useMemo(() =>
    Object.fromEntries(salaryData.filter(r => r.year === CUR_YEAR && r.note).map(r => [r.month, r.note!])),
  [salaryData]);

  // Revenue 2025 đáng tin cậy: dùng cumKy từ monthly_data (không bị ảnh hưởng bởi team_service_prev)
  // Ngưỡng tối thiểu để lọc dữ liệu revPrev bất thường (< 5 tỷ = dữ liệu sai)
  const MIN_REV = 5000; // triệu
  const rev2025Total = useMemo(() => Object.fromEntries(
    MONTHS.map(m => {
      const md = monthlyData.find((d: any) => d.month === m);
      return [m, md?.cumKy ? Math.round(md.cumKy * 1000) : null];
    })
  ), [monthlyData]);

  // ── Chart 1 data — Toàn quốc ────────────────────────────────────────────────
  const chart1Data = useMemo(() => MONTHS.map((m) => {
    const rc = revCur[m];
    const sc = salCur[m];
    const sp = salPrev[m];
    const rev25 = rev2025Total[m]; // dùng cumKy thay revPrev để tránh dữ liệu sai
    return {
      month: m,
      "DS 2026 (triệu)": rc?.total > 0 ? rc.total : null,
      "Tỷ lệ 2026 (%)":  rc && sc ? ratio(sc.total, rc.total) : null,
      "Tỷ lệ 2025 (%)":  rev25 && sp ? ratio(sp.total, rev25) : null,
    };
  }), [revCur, salCur, salPrev, rev2025Total]);

  // ── Chart 2 data — Khu vực ─────────────────────────────────────────────────
  const chart2Data = useMemo(() => MONTHS.map((m) => {
    const rc = revCur[m]; const rp = revPrev[m];
    const sc = salCur[m]; const sp = salPrev[m];
    // Chỉ dùng revPrev cho khu vực nếu total vượt ngưỡng hợp lệ
    const rpValid = rp?.total >= MIN_REV ? rp : null;
    return {
      month: m,
      "DS HN 2026":  rc?.hn > 0 ? rc.hn : null,
      "DS HCM 2026": rc?.hcm > 0 ? rc.hcm : null,
      "HN % 2026":  rc?.hn && sc ? ratio(sc.hn, rc.hn) : null,
      "HCM % 2026": rc?.hcm && sc ? ratio(sc.hcm, rc.hcm) : null,
      "HN % 2025":  rpValid?.hn && sp ? ratio(sp.hn, rpValid.hn) : null,
      "HCM % 2025": rpValid?.hcm && sp ? ratio(sp.hcm, rpValid.hcm) : null,
    };
  }), [revCur, revPrev, salCur, salPrev]);

  // ── Chart 3 data — Nhóm phòng ban ─────────────────────────────────────────
  const chart3Data = useMemo(() => MONTHS.map((m) => {
    const rc = revCur[m]; const rp = revPrev[m];
    const sc = salCur[m]; const sp = salPrev[m];
    const rpValid = rp?.total >= MIN_REV ? rp : null;
    return {
      month: m,
      "Ocean % 2026":      rc?.ocean && sc      ? ratio(sc.ocean, rc.ocean)           : null,
      "Reseller % 2026":   rc?.reseller && sc   ? ratio(sc.reseller, rc.reseller)     : null,
      "Tư vấn % 2026":     rc?.consultant && sc ? ratio(sc.consultant, rc.consultant) : null,
      "Ocean % 2025":      rpValid?.ocean && sp      ? ratio(sp.ocean, rpValid.ocean)           : null,
      "Reseller % 2025":   rpValid?.reseller && sp   ? ratio(sp.reseller, rpValid.reseller)     : null,
      "Tư vấn % 2025":     rpValid?.consultant && sp ? ratio(sp.consultant, rpValid.consultant) : null,
    };
  }), [revCur, revPrev, salCur, salPrev]);

  // ── Chart 4 — Pie tỷ trọng lương theo nhóm ────────────────────────────────
  const Q_MONTHS: Record<string, string[]> = {
    q1: ["T1","T2","T3"], q2: ["T4","T5","T6"],
    q3: ["T7","T8","T9"], q4: ["T10","T11","T12"],
  };
  const pieData = useMemo(() => {
    // Với "Cả năm" dùng pieYear có thể khác CUR_YEAR
    const salByYear = Object.fromEntries(
      salaryData.filter(r => r.year === (pieView === "year" ? pieYear : CUR_YEAR)).map(r => [r.month, r])
    );
    let selectedMonths: string[];
    let label: string;
    if (pieView === "year") {
      selectedMonths = MONTHS;
      label = `Năm ${pieYear}`;
    } else if (pieView === "quarter") {
      selectedMonths = Q_MONTHS[pieQuarter];
      label = `${pieQuarter.toUpperCase()} ${CUR_YEAR}`;
    } else {
      selectedMonths = [pieMonth];
      label = `${pieMonth} ${CUR_YEAR}`;
    }
    const months = selectedMonths.filter(m => salByYear[m]?.total > 0);
    if (!months.length) return null;
    const sum = (field: keyof SalaryMonthRecord) =>
      months.reduce((s, m) => s + ((salByYear[m]?.[field] as number) ?? 0), 0);
    return {
      label,
      slices: [
        { name: "Ocean",    value: sum("ocean"),      color: "#3b82f6" },
        { name: "Reseller", value: sum("reseller"),   color: "#8b5cf6" },
        { name: "Tư vấn",   value: sum("consultant"), color: "#10b981" },
      ].filter(d => d.value > 0),
    };
  }, [salCur, pieView, pieMonth, pieQuarter]);

  // ── KPI summary ─────────────────────────────────────────────────────────────
  const kpiSummary = useMemo(() => {
    const months2026 = MONTHS.filter(m => revCur[m]?.total > 0 && salCur[m]?.total > 0);
    if (!months2026.length) return null;

    const ratioByMonth = Object.fromEntries(
      months2026.map(m => [m, ratio(salCur[m].total, revCur[m].total) ?? 0])
    );
    const avgRatio = months2026.reduce((s, m) => s + ratioByMonth[m], 0) / months2026.length;

    // 2025 avg — chỉ tính trên CÙNG các tháng với 2026 để so đồng cấp
    const months2025 = months2026.filter(m => {
      const md = monthlyData.find((d: any) => d.month === m);
      return md?.cumKy && salPrev[m]?.total > 0;
    });
    const avgPrev = months2025.length === months2026.length
      ? months2025.reduce((s, m) => {
          const md = monthlyData.find((d: any) => d.month === m);
          return s + (ratio(salPrev[m].total, Math.round(md.cumKy * 1000)) ?? 0);
        }, 0) / months2025.length
      : null; // null nếu thiếu DL 2025 cho bất kỳ tháng nào của 2026

    // Tháng có tỷ lệ cao nhất 2026
    const worstMonth = months2026.reduce((a, b) => ratioByMonth[a] >= ratioByMonth[b] ? a : b);

    // Chi phí lương chênh lệch tuyệt đối so CK (triệu VNĐ)
    // = tổng lương thực tế - tổng lương nếu giữ nguyên tỷ lệ 2025
    let extraCost: number | null = null;
    if (avgPrev !== null) {
      const totalSal = months2026.reduce((s, m) => s + salCur[m].total, 0);
      const totalRev = months2026.reduce((s, m) => s + revCur[m].total, 0);
      extraCost = totalSal - totalRev * avgPrev / 100;
    }

    return { avgRatio, avgPrev, count: months2026.length, worstMonth, worstRatio: ratioByMonth[worstMonth], extraCost };
  }, [revCur, salCur, salPrev, monthlyData]);

  const hasData = Object.keys(salCur).length > 0 || Object.keys(salPrev).length > 0;

  return (
    <div>
      <Header title="Báo Cáo Tài Chính" />

      <div className="p-6 space-y-5">
        <PageHeader
          title="Phân Tích Tỷ Lệ Lương / Doanh Thu"
          subtitle={`Toàn quốc · Khu vực · Nhóm phòng ban — ${CUR_YEAR} vs ${PREV_YEAR}`}
        />

        {/* KPI cards */}
        {kpiSummary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(() => {
              const ratioColor = (r: number) => r < 7
                ? { border: "border-green-500/30", text: "text-green-400" }
                : { border: "border-amber-500/30", text: "text-amber-400" };
              const c26 = ratioColor(kpiSummary.avgRatio);
              const c25 = kpiSummary.avgPrev !== null ? ratioColor(kpiSummary.avgPrev) : { border: "border-slate-600", text: "text-slate-400" };
              const cW  = ratioColor(kpiSummary.worstRatio);

              const extraAbs = kpiSummary.extraCost;
              const extraTy  = extraAbs !== null ? extraAbs / 1000 : null;
              const extraStr = extraTy !== null
                ? `${extraTy > 0 ? "+" : ""}${extraTy.toFixed(2)} tỷ`
                : "—";
              const cExtra = extraAbs !== null
                ? extraAbs > 0 ? { border: "border-red-500/30", text: "text-red-400" } : { border: "border-green-500/30", text: "text-green-400" }
                : { border: "border-slate-600", text: "text-slate-400" };

              return [
                { label: `TB tỷ lệ lương ${CUR_YEAR}`, value: `${kpiSummary.avgRatio.toFixed(1)}%`, border: c26.border, text: c26.text, sub: `${kpiSummary.count} tháng · ${kpiSummary.avgRatio < 7 ? "✓ tốt" : "⚠ cần chú ý"}` },
                { label: `TB tỷ lệ lương ${PREV_YEAR}`, value: kpiSummary.avgPrev !== null ? `${kpiSummary.avgPrev.toFixed(1)}%` : "—", border: c25.border, text: c25.text, sub: "cùng kỳ năm trước" },
                { label: "Chi lương tăng thêm vs CK", value: extraStr, border: cExtra.border, text: cExtra.text, sub: extraAbs !== null ? (extraAbs > 0 ? "so với giữ tỷ lệ 2025" : "tiết kiệm so CK") : "chưa có DL 2025" },
                { label: "Tháng chi phí cao nhất", value: `${kpiSummary.worstMonth} · ${kpiSummary.worstRatio.toFixed(1)}%`, border: cW.border, text: cW.text, sub: "cần xem xét" },
              ].map((item) => (
                <div key={item.label} className={`bg-slate-800/60 rounded-xl border p-4 ${item.border}`}>
                  <div className="text-xs text-slate-400 mb-2">{item.label}</div>
                  <div className={`text-2xl font-bold ${item.text}`}>{item.value}</div>
                  <div className="text-xs text-slate-500 mt-1">{item.sub}</div>
                </div>
              ));
            })()}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-800/50 rounded-xl p-1 w-fit">
          {[
            { key: "report", label: "Báo Cáo" },
            ...(isAdmin ? [{ key: "input", label: "Nhập Liệu Lương" }] : []),
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB: BÁO CÁO ─────────────────────────────────────────────────────── */}
        {activeTab === "report" && (
          <div className="space-y-5">
            {!hasData && (
              <div className="text-center py-12 text-slate-500 text-sm">
                Chưa có dữ liệu lương. {isAdmin && "Vào tab «Nhập Liệu Lương» để thêm."}
              </div>
            )}

            {/* Chart 1 — Toàn quốc */}
            <Card>
              <CardHeader>
                <CardTitle>Tỷ Lệ Lương / DS — Toàn Quốc</CardTitle>
                <Badge variant="neutral">So cùng kỳ</Badge>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={chart1Data} margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <YAxis yAxisId="rev" orientation="left" tick={{ fill: "#94a3b8", fontSize: 11 }}
                      tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}B` : `${v}M`}
                      label={{ value: "Doanh số", angle: -90, position: "insideLeft", fill: "#64748b", fontSize: 11 }} />
                    <YAxis yAxisId="pct" orientation="right" tick={{ fill: "#94a3b8", fontSize: 11 }}
                      tickFormatter={(v) => `${v}%`}
                      label={{ value: "Tỷ lệ %", angle: 90, position: "insideRight", fill: "#64748b", fontSize: 11 }} />
                    <Tooltip {...TOOLTIP_STYLE}
                      formatter={(v: any, name: any) => [
                        String(name).includes("DS") ? `${Number(v).toLocaleString("vi-VN")} triệu` : `${v}%`, name,
                      ]} />
                    <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                    <Bar yAxisId="rev" dataKey="DS 2026 (triệu)" fill="#3b82f6" opacity={0.6} radius={[2,2,0,0]} />
                    <Line yAxisId="pct" type="monotone" dataKey="Tỷ lệ 2026 (%)" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                    <Line yAxisId="pct" type="monotone" dataKey="Tỷ lệ 2025 (%)" stroke="#475569" strokeWidth={1.5} strokeDasharray="4 3" dot={{ r: 2 }} connectNulls />
                    {Object.entries(notesByMonth).map(([m, note]) => (
                      <ReferenceLine key={m} x={m} yAxisId="pct" stroke="#fbbf24" strokeDasharray="3 3"
                        label={{ value: "📝", position: "top", fontSize: 12 }} />
                    ))}
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Chart 2 — Khu vực HN / HCM */}
            <Card>
              <CardHeader>
                <CardTitle>Tỷ Lệ Lương — Theo Khu Vực</CardTitle>
                <Badge variant="neutral">HN · HCM</Badge>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={chart2Data} margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <YAxis yAxisId="rev" orientation="left" tick={{ fill: "#94a3b8", fontSize: 11 }}
                      tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}B` : `${v}M`} />
                    <YAxis yAxisId="pct" orientation="right" tick={{ fill: "#94a3b8", fontSize: 11 }}
                      tickFormatter={(v) => `${v}%`} />
                    <Tooltip {...TOOLTIP_STYLE}
                      formatter={(v: any, name: any) => [
                        String(name).startsWith("DS") ? `${Number(v).toLocaleString("vi-VN")} triệu` : `${v}%`, name,
                      ]} />
                    <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                    <Bar yAxisId="rev" dataKey="DS HN 2026"  fill="#60a5fa" opacity={0.5} radius={[2,2,0,0]} />
                    <Bar yAxisId="rev" dataKey="DS HCM 2026" fill="#34d399" opacity={0.5} radius={[2,2,0,0]} />
                    <Line yAxisId="pct" type="monotone" dataKey="HN % 2026"  stroke="#60a5fa" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                    <Line yAxisId="pct" type="monotone" dataKey="HCM % 2026" stroke="#34d399" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                    <Line yAxisId="pct" type="monotone" dataKey="HN % 2025"  stroke="#60a5fa" strokeWidth={1.5} strokeDasharray="4 3" opacity={0.5} connectNulls />
                    <Line yAxisId="pct" type="monotone" dataKey="HCM % 2025" stroke="#34d399" strokeWidth={1.5} strokeDasharray="4 3" opacity={0.5} connectNulls />
                    {Object.entries(notesByMonth).map(([m, note]) => (
                      <ReferenceLine key={m} x={m} yAxisId="pct" stroke="#fbbf24" strokeDasharray="3 3"
                        label={{ value: "📝", position: "top", fontSize: 12 }} />
                    ))}
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Chart 3 — Nhóm phòng ban */}
            <Card>
              <CardHeader>
                <CardTitle>Tỷ Lệ Lương — Theo Nhóm Phòng Ban</CardTitle>
                <Badge variant="neutral">Ocean · Reseller · Tư vấn</Badge>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={chart3Data} margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                    <Tooltip {...TOOLTIP_STYLE} formatter={(v: any) => [`${v}%`]} />
                    <Legend wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                    <Line type="monotone" dataKey="Ocean % 2026"    stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                    <Line type="monotone" dataKey="Reseller % 2026" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                    <Line type="monotone" dataKey="Tư vấn % 2026"   stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                    <Line type="monotone" dataKey="Ocean % 2025"    stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="4 3" opacity={0.5} connectNulls />
                    <Line type="monotone" dataKey="Reseller % 2025" stroke="#8b5cf6" strokeWidth={1.5} strokeDasharray="4 3" opacity={0.5} connectNulls />
                    <Line type="monotone" dataKey="Tư vấn % 2025"   stroke="#10b981" strokeWidth={1.5} strokeDasharray="4 3" opacity={0.5} connectNulls />
                    {Object.entries(notesByMonth).map(([m, note]) => (
                      <ReferenceLine key={m} x={m} stroke="#fbbf24" strokeDasharray="3 3"
                        label={{ value: "📝", position: "top", fontSize: 12 }} />
                    ))}
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Chart 4 — Pie tỷ trọng */}
            {pieData && (
              <Card>
                <CardHeader>
                  <CardTitle>Cơ Cấu Lương Theo Nhóm</CardTitle>
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Tháng */}
                    <div className="flex items-center gap-1">
                      <button onClick={() => setPieView("month")}
                        className={`px-2.5 py-1 rounded-l-lg text-xs font-medium border-r border-slate-600 transition-all ${pieView === "month" ? "bg-blue-600 text-white" : "bg-slate-700/50 text-slate-400 hover:text-white"}`}>
                        Tháng
                      </button>
                      <select value={pieMonth} onChange={e => { setPieMonth(e.target.value); setPieView("month"); }}
                        className="bg-slate-700/50 border-0 rounded-r-lg px-2 py-1 text-xs text-slate-300 focus:outline-none cursor-pointer">
                        {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    {/* Quý */}
                    <div className="flex items-center gap-1">
                      <button onClick={() => setPieView("quarter")}
                        className={`px-2.5 py-1 rounded-l-lg text-xs font-medium border-r border-slate-600 transition-all ${pieView === "quarter" ? "bg-blue-600 text-white" : "bg-slate-700/50 text-slate-400 hover:text-white"}`}>
                        Quý
                      </button>
                      <select value={pieQuarter} onChange={e => { setPieQuarter(e.target.value as any); setPieView("quarter"); }}
                        className="bg-slate-700/50 border-0 rounded-r-lg px-2 py-1 text-xs text-slate-300 focus:outline-none cursor-pointer">
                        {["q1","q2","q3","q4"].map(q => <option key={q} value={q}>{q.toUpperCase()}</option>)}
                      </select>
                    </div>
                    {/* Cả năm */}
                    <div className="flex items-center gap-1">
                      <button onClick={() => setPieView("year")}
                        className={`px-2.5 py-1 rounded-l-lg text-xs font-medium border-r border-slate-600 transition-all ${pieView === "year" ? "bg-blue-600 text-white" : "bg-slate-700/50 text-slate-400 hover:text-white"}`}>
                        Cả năm
                      </button>
                      <select value={pieYear} onChange={e => { setPieYear(Number(e.target.value)); setPieView("year"); }}
                        className="bg-slate-700/50 border-0 rounded-r-lg px-2 py-1 text-xs text-slate-300 focus:outline-none cursor-pointer">
                        {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                    <Badge variant="neutral">{pieData.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col lg:flex-row items-center gap-6">
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={pieData.slices} cx="50%" cy="50%" outerRadius={90} dataKey="value" paddingAngle={2}
                          label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                          labelLine={{ stroke: "#475569" }}>
                          {pieData.slices.map((d, i) => <Cell key={i} fill={d.color} />)}
                        </Pie>
                        <Tooltip {...TOOLTIP_STYLE}
                          formatter={(v: any) => [`${Number(v).toLocaleString("vi-VN")} triệu`]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 min-w-[180px]">
                      {pieData.slices.map((d) => (
                        <div key={d.name} className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: d.color }} />
                          <span className="text-xs text-slate-300 flex-1">{d.name}</span>
                          <span className="text-xs font-semibold text-white">{d.value.toLocaleString("vi-VN")} tr</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ── TAB: NHẬP LIỆU (admin only) ───────────────────────────────────────── */}
        {activeTab === "input" && isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>Nhập Dữ Liệu Lương</CardTitle>
              <div className="flex items-center gap-3">
                <select
                  value={inputYear}
                  onChange={(e) => handleYearChange(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                >
                  {[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
                <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
                  <Save size={13} /> {saving ? "Đang lưu..." : savedMsg || "Lưu"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500 mb-4">Đơn vị: triệu VNĐ. Doanh số lấy tự động từ dữ liệu đã nhập ở các trang khác.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      {["Tháng", "Tổng lương", "Tư vấn HN", "Tư vấn HCM", "Ocean", "Reseller", "Tư vấn", "DS tháng (triệu)", "Tỷ lệ % vs CK", "Ghi chú"].map((h) => (
                        <th key={h} className="text-left text-xs text-slate-400 font-medium py-2 px-2 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/40">
                    {rows.map((row, i) => {
                      // DS theo năm đang nhập:
                      // 2026 → team_service (revCur, triệu)
                      // 2025 → monthly_data.cumKy (cùng kỳ 2025, tỷ → triệu)
                      // khác → không có
                      let revTotal: number | null = null;
                      if (inputYear === CUR_YEAR) {
                        revTotal = revCur[row.month]?.total > 0 ? revCur[row.month].total : null;
                      } else if (inputYear === PREV_YEAR) {
                        const md = monthlyData.find((d: any) => d.month === row.month);
                        revTotal = md?.cumKy ? Math.round(md.cumKy * 1000) : null;
                      }
                      const r = revTotal ? ratio(row.total, revTotal) : null;
                      // So cùng kỳ: chỉ có nếu inputYear=2026 (có DS 2025 từ cumKy + lương 2025)
                      let rPrev: number | null = null;
                      if (inputYear === CUR_YEAR) {
                        const md = monthlyData.find((d: any) => d.month === row.month);
                        const prevRevTotal = md?.cumKy ? Math.round(md.cumKy * 1000) : null;
                        const prevSal = salaryData.find(s => s.year === PREV_YEAR && s.month === row.month);
                        rPrev = prevRevTotal && prevSal?.total ? ratio(prevSal.total, prevRevTotal) : null;
                      }
                      const diff = r !== null && rPrev !== null ? r - rPrev : null;
                      return (
                        <tr key={row.month} className="hover:bg-slate-700/20 transition-colors">
                          <td className="py-2 px-2 text-slate-300 font-medium w-12">{row.month}</td>
                          {(["total","hn","hcm","ocean","reseller","consultant"] as const).map((field) => (
                            <td key={field} className="py-1.5 px-1.5">
                              <input
                                type="number" min={0} step={0.1}
                                value={row[field] || ""}
                                onChange={(e) => setCell(i, field, e.target.value)}
                                placeholder="0"
                                className="w-24 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-blue-500 focus:outline-none tabular-nums"
                              />
                            </td>
                          ))}
                          <td className="py-2 px-2 text-xs text-slate-400 tabular-nums">
                            {revTotal ? revTotal.toLocaleString("vi-VN") : "—"}
                          </td>
                          <td className="py-2 px-2">
                            {r !== null ? (
                              <div className="flex items-center gap-1">
                                <span className={`text-xs font-bold ${r > 40 ? "text-red-400" : r > 30 ? "text-amber-400" : "text-green-400"}`}>
                                  {r}%
                                </span>
                                {diff !== null && (
                                  <span className={`text-xs ${diff > 0 ? "text-red-400" : diff < 0 ? "text-green-400" : "text-slate-400"}`}>
                                    {diff > 0 ? <TrendingUp size={11} /> : diff < 0 ? <TrendingDown size={11} /> : <Minus size={11} />}
                                    {Math.abs(diff).toFixed(1)}pp
                                  </span>
                                )}
                              </div>
                            ) : <span className="text-slate-600 text-xs">—</span>}
                          </td>
                          <td className="py-1.5 px-1.5">
                            <input
                              type="text"
                              value={row.note || ""}
                              onChange={(e) => setNote(i, e.target.value)}
                              placeholder="Ghi chú bất thường..."
                              className="w-48 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:border-amber-500 focus:outline-none"
                            />
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
      </div>
    </div>
  );
}
