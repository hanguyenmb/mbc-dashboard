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
import { OVERVIEW_KPIs, QUARTERLY_DATA, MONTHLY_DATA, SERVICE_MONTHLY, REVENUE_TYPE } from "@/lib/mock-data";
import { Sparkles, History, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { AiAnalysisPanel } from "@/components/ai/ai-analysis-panel";

interface OverviewClientProps {
  userName: string;
  monthlyData: typeof MONTHLY_DATA;
  serviceMonthly: typeof SERVICE_MONTHLY;
  revenueType: typeof REVENUE_TYPE;
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
    nam2025: "Kết quả 2025", nam2026: "Kết quả 2026",
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

export function OverviewClient({ userName, monthlyData, serviceMonthly, revenueType }: OverviewClientProps) {
  const kpi = OVERVIEW_KPIs;
  // Dùng prop (từ DB) thay vì import mock
  const MONTHLY_DATA = monthlyData;
  const SERVICE_MONTHLY = serviceMonthly;
  const REVENUE_TYPE = revenueType;
  const [showAI, setShowAI] = useState(false);
  const [view, setView] = useState<"thang" | "quy">("thang");
  // Mặc định tháng hiện tại theo thời gian thực, giới hạn theo số tháng có dữ liệu
  const dataMonths = monthlyData.filter(m => m.hn != null);
  const realMonthIdx = Math.min(new Date().getMonth(), dataMonths.length - 1);
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(realMonthIdx);
  const [svcView, setSvcView] = useState<"stacked" | "grouped">("stacked");
  const [regionTab, setRegionTab] = useState<"hn" | "hcm">("hn");

  const SVC_KEYS = [
    { key: "hostMail",    label: "Hosting/Email",      color: "#0066CC" },
    { key: "msgws",       label: "MS/GWS",             color: "#10B981" },
    { key: "tenMien",     label: "Tên miền + DV khác", color: "#F59E0B" },
    { key: "transferGws", label: "Transfer GWS",       color: "#8B5CF6" },
    { key: "saleAi",      label: "Sale AI",            color: "#EF4444" },
    { key: "elastic",     label: "Elastic",            color: "#06B6D4" },
  ] as const;

  // Tính động Q1 từ SERVICE_MONTHLY — tự cập nhật khi thêm tháng mới
  const svcQ1 = SVC_KEYS.map((s) => ({
    name: s.label,
    color: s.color,
    value: SERVICE_MONTHLY.reduce((sum, m) => sum + ((m as any)[s.key] as number), 0),
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

  // KPI Q1 tổng
  const tongThucHien = MONTHLY_DATA.reduce((s, m) => s + ((m.hn ?? 0) + (m.hcm ?? 0)), 0);
  const tongMt8  = MONTHLY_DATA.slice(0, 3).reduce((s, m) => s + m.mt8,  0);
  const tongMt10 = MONTHLY_DATA.slice(0, 3).reduce((s, m) => s + m.mt10, 0);
  const tlMt8  = tongMt8  > 0 ? (tongThucHien / tongMt8)  * 100 : 0;
  const tlMt10 = tongMt10 > 0 ? (tongThucHien / tongMt10) * 100 : 0;

  return (
    <div>
      <Header title="Tổng Quan">
        <Button variant="ghost" size="sm" onClick={() => setShowAI(true)}>
          <History size={14} /> Lịch Sử AI
        </Button>
        <Button variant="primary" size="sm" onClick={() => setShowAI(true)}>
          <Sparkles size={14} /> Phân Tích AI
        </Button>
      </Header>

      <div className="p-6">
        <PageHeader
          title="Tổng Quan Dashboard"
          subtitle={`Xin chào ${userName}. Đây là tình hình kinh doanh hôm nay.`}
        >
          <div className="flex items-center gap-2">
            {(["thang", "quy"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  view === v ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-400 hover:text-white"
                }`}>
                {v === "thang" ? "Theo Tháng" : "Theo Quý"}
              </button>
            ))}
            {/* Chọn tháng khi ở view tháng */}
            {view === "thang" && (
              <div className="flex items-center gap-1 ml-2 bg-slate-800/60 rounded-lg p-0.5">
                {MONTHLY_DATA.filter(m => m.hn != null).map((m, i) => (
                  <button key={m.month} onClick={() => setSelectedMonthIdx(i)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      selectedMonthIdx === i ? "bg-blue-500 text-white" : "text-slate-400 hover:text-white"
                    }`}>
                    {m.month}
                  </button>
                ))}
              </div>
            )}
          </div>
        </PageHeader>

        {/* ── Summary KPI strip ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {(view === "thang" ? [
            { label: `Thực hiện ${selMonth?.month ?? ""}`,   value: `${selThucHien.toFixed(2)} tỷ`,            sub: "HN + HCM",              color: "border-blue-500/20 text-blue-400" },
            { label: `Mục tiêu 8% ${selMonth?.month ?? ""}`, value: `${(selMonth?.mt8  ?? 0).toFixed(2)} tỷ`,  sub: `Đạt ${selTlMt8.toFixed(1)}%`,  color: selTlMt8  >= 100 ? "border-green-500/20 text-green-400" : "border-amber-500/20 text-amber-400" },
            { label: `Mục tiêu 10% ${selMonth?.month ?? ""}`,value: `${(selMonth?.mt10 ?? 0).toFixed(2)} tỷ`,  sub: `Đạt ${selTlMt10.toFixed(1)}%`, color: selTlMt10 >= 100 ? "border-green-500/20 text-green-400" : "border-amber-500/20 text-amber-400" },
            { label: "HN / HCM",
              value: `${(selMonth?.hn ?? 0).toFixed(2)} / ${(selMonth?.hcm ?? 0).toFixed(2)}`,
              sub: selThucHien > 0 ? `HN ${((selMonth?.hn??0)/selThucHien*100).toFixed(0)}% · HCM ${((selMonth?.hcm??0)/selThucHien*100).toFixed(0)}%` : "tỷ VNĐ",
              color: "border-slate-500/20 text-slate-300" },
          ] : [
            { label: "Tổng thực hiện (Q1)", value: `${tongThucHien.toFixed(2)} tỷ`, sub: "HN + HCM", color: "border-blue-500/20 text-blue-400" },
            { label: "Mục tiêu 8% (Q1)",    value: `${tongMt8.toFixed(2)} tỷ`,      sub: `Đạt ${tlMt8.toFixed(1)}%`,  color: tlMt8  >= 100 ? "border-green-500/20 text-green-400" : "border-amber-500/20 text-amber-400" },
            { label: "Mục tiêu 10% (Q1)",   value: `${tongMt10.toFixed(2)} tỷ`,     sub: `Đạt ${tlMt10.toFixed(1)}%`, color: tlMt10 >= 100 ? "border-green-500/20 text-green-400" : "border-amber-500/20 text-amber-400" },
            { label: "Tăng trưởng Q1",      value: "109.49%",                       sub: "So với 2025",               color: "border-green-500/20 text-green-400" },
          ]).map((item) => (
            <div key={item.label} className={`bg-slate-800/60 rounded-xl border p-4 ${item.color.split(" ")[0]}`}>
              <div className="text-xs text-slate-400 mb-1">{item.label}</div>
              <div className={`text-xl font-bold ${item.color.split(" ")[1]}`}>{item.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{item.sub}</div>
            </div>
          ))}
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
        {view === "quy" && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Kết Quả & Mục Tiêu Theo Quý (tỷ VNĐ)</CardTitle>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-3 h-3 rounded-sm bg-slate-500 inline-block opacity-60" />2025</span>
                <span className="flex items-center gap-1.5 text-xs text-blue-400"><span className="w-3 h-3 rounded-sm bg-blue-600 inline-block" />2026</span>
                <span className="flex items-center gap-1.5 text-xs text-amber-400"><span className="w-5 border-t-2 border-dashed border-amber-400 inline-block" />MT 8%</span>
                <span className="flex items-center gap-1.5 text-xs text-green-400"><span className="w-5 border-t-2 border-dashed border-green-400 inline-block" />MT 10%</span>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={QUARTERLY_DATA} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="quy" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip {...TOOLTIP_STYLE} formatter={fmtTip} />
                  <Bar dataKey="nam2025" name="nam2025" fill="#475569" radius={[4,4,0,0]} maxBarSize={36} opacity={0.7} />
                  <Bar dataKey="nam2026" name="nam2026" fill="#2563eb" radius={[4,4,0,0]} maxBarSize={36} />
                  <Line type="monotone" dataKey="mt8"  name="mt8"  stroke="#F59E0B" strokeWidth={2} strokeDasharray="5 4" dot={{ fill: "#F59E0B", r: 4 }} />
                  <Line type="monotone" dataKey="mt10" name="mt10" stroke="#10B981" strokeWidth={2} strokeDasharray="5 4" dot={{ fill: "#10B981", r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>

              {/* Quarterly achievement table */}
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-700/50">
                      <td className="py-2 pr-4">Chỉ tiêu</td>
                      {QUARTERLY_DATA.map(q => <td key={q.quy} className="py-2 px-3 text-center">{q.quy}</td>)}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {[
                      { label: "KQ 2025",       key: "nam2025",    color: "text-slate-400" },
                      { label: "KQ 2026",       key: "nam2026",    color: "text-blue-400"  },
                      { label: "Mục tiêu 8%",   key: "mt8",        color: "text-amber-400" },
                      { label: "Mục tiêu 10%",  key: "mt10",       color: "text-green-400" },
                      { label: "% vs MT 8%",    key: "tlMt8",      color: "text-amber-400", isRate: true },
                      { label: "% vs MT 10%",   key: "tlMt10",     color: "text-green-400", isRate: true },
                      { label: "Tăng trưởng",   key: "tangTruong", color: "text-cyan-400",  isRate: true },
                    ].map(row => (
                      <tr key={row.label}>
                        <td className={`py-1.5 pr-4 font-medium ${row.color}`}>{row.label}</td>
                        {QUARTERLY_DATA.map(q => {
                          const v = (q as any)[row.key];
                          if (v == null) return <td key={q.quy} className="py-1.5 px-3 text-center text-slate-700">—</td>;
                          if (row.isRate) {
                            const isGood = v >= 100;
                            return (
                              <td key={q.quy} className={`py-1.5 px-3 text-center font-semibold ${v > 0 ? (isGood ? "text-green-400" : "text-amber-400") : "text-slate-600"}`}>
                                {v > 0 ? `${v.toFixed(2)}%` : "—"}
                              </td>
                            );
                          }
                          return <td key={q.quy} className="py-1.5 px-3 text-center text-slate-300">{v.toFixed(2)}</td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── CHART: Doanh số so sánh 2025 vs 2026 (HN/HCM) ── */}
        {(() => {
          // Tính curr_hn / curr_hcm cho 2026 từ dữ liệu hiện có
          const chartData = REVENUE_TYPE.map(r => ({
            ...r,
            curr_hn:  r.dkHn  + r.ghHn,
            curr_hcm: r.dkHcm + r.ghHcm,
          }));
          const hasData2026 = (r: typeof chartData[0]) => r.curr_hn + r.curr_hcm > 0;
          return (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Doanh Số Tổng Hợp Theo Tháng — So Sánh 2025 vs 2026 (tỷ VNĐ)</CardTitle>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1.5 text-xs text-blue-400"><span className="w-2.5 h-2.5 rounded-sm inline-block bg-blue-500" />HN 2026</span>
              <span className="flex items-center gap-1.5 text-xs text-cyan-400"><span className="w-2.5 h-2.5 rounded-sm inline-block bg-cyan-400" />HCM 2026</span>
              <span className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-2.5 h-2.5 rounded-sm inline-block opacity-60" style={{background:"#3b82f6"}} />HN 2025</span>
              <span className="flex items-center gap-1.5 text-xs text-slate-400"><span className="w-2.5 h-2.5 rounded-sm inline-block opacity-60" style={{background:"#22d3ee"}} />HCM 2025</span>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={chartData} margin={{ top: 28, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}`} />
                <Tooltip {...TOOLTIP_STYLE}
                  formatter={(v: any, name: any) => {
                    const m: Record<string, string> = { curr_hn: "HN 2026", curr_hcm: "HCM 2026", prev_hn: "HN 2025", prev_hcm: "HCM 2025" };
                    return [`${Number(v).toFixed(3)} tỷ`, m[String(name)] ?? name] as [string, string];
                  }}
                />
                {/* 2025 — HN (dưới, mờ) */}
                <Bar dataKey="prev_hn" name="prev_hn" stackId="prev" fill="#3b82f6" opacity={0.45} maxBarSize={36}>
                  <LabelList dataKey="prev_hn" content={(props: any) => {
                    const { x, y, width, height, value, index } = props;
                    if (!height || height < 18) return null;
                    const entry = chartData[index];
                    const total = entry.prev_hn + entry.prev_hcm;
                    const pct = total > 0 ? ((value / total) * 100).toFixed(0) : "0";
                    return (
                      <text x={x + width / 2} y={y + height / 2} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={9} fontWeight={600}>
                        HN {pct}%
                      </text>
                    );
                  }} />
                </Bar>
                {/* 2025 — HCM (trên, mờ) + tổng trên đỉnh */}
                <Bar dataKey="prev_hcm" name="prev_hcm" stackId="prev" fill="#22d3ee" opacity={0.45} maxBarSize={36} radius={[3,3,0,0]}>
                  <LabelList dataKey="prev_hcm" content={(props: any) => {
                    const { x, y, width, height, value, index } = props;
                    if (!height) return null;
                    const entry = chartData[index];
                    const total = entry.prev_hn + entry.prev_hcm;
                    const pct = total > 0 ? ((value / total) * 100).toFixed(0) : "0";
                    return (
                      <g>
                        {height >= 18 && (
                          <text x={x + width / 2} y={y + height / 2} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={9} fontWeight={600}>
                            HCM {pct}%
                          </text>
                        )}
                        <text x={x + width / 2} y={y - 7} textAnchor="middle" dominantBaseline="auto" fill="#94a3b8" fontSize={10} fontWeight={600}>
                          {total.toFixed(2)}
                        </text>
                      </g>
                    );
                  }} />
                </Bar>
                {/* 2026 — HN (dưới, sáng) */}
                <Bar dataKey="curr_hn" name="curr_hn" stackId="curr" fill="#2563eb" maxBarSize={36}>
                  <LabelList dataKey="curr_hn" content={(props: any) => {
                    const { x, y, width, height, value, index } = props;
                    if (!height || height < 18) return null;
                    const entry = chartData[index];
                    if (!hasData2026(entry)) return null;
                    const total = entry.curr_hn + entry.curr_hcm;
                    const pct = total > 0 ? ((value / total) * 100).toFixed(0) : "0";
                    return (
                      <text x={x + width / 2} y={y + height / 2} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={9} fontWeight={600}>
                        HN {pct}%
                      </text>
                    );
                  }} />
                </Bar>
                {/* 2026 — HCM (trên, sáng) + tổng trên đỉnh */}
                <Bar dataKey="curr_hcm" name="curr_hcm" stackId="curr" fill="#06b6d4" maxBarSize={36} radius={[3,3,0,0]}>
                  <LabelList dataKey="curr_hcm" content={(props: any) => {
                    const { x, y, width, height, value, index } = props;
                    if (!height) return null;
                    const entry = chartData[index];
                    if (!hasData2026(entry)) return null;
                    const total = entry.curr_hn + entry.curr_hcm;
                    const pct = total > 0 ? ((value / total) * 100).toFixed(0) : "0";
                    return (
                      <g>
                        {height >= 18 && (
                          <text x={x + width / 2} y={y + height / 2} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={9} fontWeight={600}>
                            HCM {pct}%
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

            {/* Bảng so sánh tóm tắt */}
            <div className="mt-4 overflow-x-auto rounded-lg border border-slate-700/50">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-800/80">
                    <td className="py-2 px-3 font-semibold text-slate-400 border-b border-slate-700/50 min-w-[110px]">Chỉ tiêu</td>
                    {REVENUE_TYPE.map(r => <td key={r.month} className="py-2 px-2 text-right font-semibold text-slate-400 border-b border-slate-700/50 min-w-[44px]">{r.month}</td>)}
                    <td className="py-2 px-3 text-right font-bold text-white border-b border-slate-700/50">Tổng</td>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "HN 2026",   fn: (r: typeof chartData[0]) => r.dkHn + r.ghHn,     color: "text-blue-300",  bg: "bg-blue-500/10",   border: "border-blue-500/20",  lb: "border-l-2 border-blue-400" },
                    { label: "HCM 2026",  fn: (r: typeof chartData[0]) => r.dkHcm + r.ghHcm,   color: "text-cyan-300",  bg: "bg-cyan-500/10",   border: "border-cyan-500/20",  lb: "border-l-2 border-cyan-400" },
                    { label: "HN 2025",   fn: (r: typeof chartData[0]) => r.prev_hn,            color: "text-blue-400",  bg: "bg-slate-700/20",  border: "border-slate-600/30", lb: "border-l-2 border-blue-700" },
                    { label: "HCM 2025",  fn: (r: typeof chartData[0]) => r.prev_hcm,           color: "text-cyan-400",  bg: "bg-slate-700/10",  border: "border-slate-600/20", lb: "border-l-2 border-cyan-700" },
                  ].map((row) => {
                    const vals = chartData.map(r => row.fn(r));
                    const tot = vals.filter(v => v > 0).reduce((s, v) => s + v, 0);
                    return (
                      <tr key={row.label} className={`${row.bg} border-b ${row.border}`}>
                        <td className={`py-1.5 px-3 font-semibold ${row.color} ${row.lb}`}>{row.label}</td>
                        {vals.map((v, i) => (
                          <td key={i} className={`py-1.5 px-2 text-right tabular-nums ${v > 0 ? row.color : "text-slate-700"}`}>
                            {v > 0 ? v.toFixed(2) : "—"}
                          </td>
                        ))}
                        <td className={`py-1.5 px-3 text-right font-bold tabular-nums ${row.color}`}>{tot.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
          );
        })()}

        {/* ── CHART: Tỉ trọng 6 nhóm dịch vụ ── */}
        <Card className="mb-4">
            <CardHeader>
              <CardTitle>Tỉ Trọng Dịch Vụ Đăng Ký Mới</CardTitle>
              <Badge variant="brand">6 nhóm</Badge>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col lg:flex-row gap-6 items-center">
                {/* Donut chart */}
                <div className="flex-shrink-0 w-full lg:w-[320px]">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={svcQ1} cx="50%" cy="50%"
                        innerRadius={68} outerRadius={105}
                        paddingAngle={2} dataKey="value" nameKey="name"
                        label={({ cx, cy, midAngle, outerRadius, percent, name }: any) => {
                          if (percent < 0.03) return null;
                          const RADIAN = Math.PI / 180;
                          const r = outerRadius + 28;
                          const x = cx + r * Math.cos(-midAngle * RADIAN);
                          const y = cy + r * Math.sin(-midAngle * RADIAN);
                          const shortName = name.split("/")[0].split(" ")[0];
                          return (
                            <text x={x} y={y} textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" fill="#cbd5e1" fontSize={11} fontWeight={500}>
                              {shortName} {(percent * 100).toFixed(1)}%
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

                {/* Stats bên phải */}
                <div className="flex-1 w-full space-y-2">
                  {svcQ1.map((g) => {
                    const pctVal = ((g.value / totalService) * 100);
                    return (
                      <div key={g.name} className="flex items-center gap-3 px-2 py-1.5 rounded-lg bg-slate-800/40">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: g.color }} />
                        <span className="text-xs text-slate-300 flex-1 min-w-0">{g.name}</span>
                        {/* Progress bar */}
                        <div className="w-24 h-2 rounded-full bg-slate-700/60 overflow-hidden flex-shrink-0">
                          <div className="h-full rounded-full" style={{ width: `${pctVal}%`, background: g.color }} />
                        </div>
                        <span className="text-xs font-bold text-white w-20 text-right tabular-nums">{g.value.toLocaleString()}M</span>
                        <span className="text-xs font-semibold w-12 text-right tabular-nums" style={{ color: g.color }}>{pctVal.toFixed(1)}%</span>
                      </div>
                    );
                  })}
                  <div className="border-t border-slate-700/50 pt-2.5 mt-1 flex justify-between items-center px-2">
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

            {/* HN / HCM breakdown table — tab riêng */}
            {(() => {
              const isHN = regionTab === "hn";
              const textColor  = isHN ? "text-blue-400" : "text-cyan-400";
              const totalColor = isHN ? "text-blue-300" : "text-cyan-300";
              const cellColor  = isHN ? "text-blue-200" : "text-cyan-200";
              return (
                <div className="mt-6 space-y-3">
                  <div className="flex gap-1 bg-slate-800/50 rounded-xl p-1 w-fit">
                    {(["hn", "hcm"] as const).map((r) => (
                      <button key={r} onClick={() => setRegionTab(r)}
                        className={`px-5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                          regionTab === r ? (r === "hn" ? "bg-blue-600 text-white" : "bg-cyan-600 text-white") : "text-slate-400 hover:text-white"
                        }`}
                      >
                        {r === "hn" ? "Hà Nội" : "HCM"}
                      </button>
                    ))}
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-slate-700/50">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-800/80">
                          <td className="py-2.5 px-3 font-semibold text-slate-400 border-b border-slate-700/60 min-w-[150px]">Nhóm DV</td>
                          {SERVICE_MONTHLY.map((m) => (
                            <td key={m.month} className={`py-2.5 px-3 text-right font-semibold border-b border-slate-700/60 min-w-[80px] ${textColor}`}>{m.month}</td>
                          ))}
                          <td className="py-2.5 px-3 text-right font-bold text-white border-b border-slate-700/60 min-w-[80px]">Q1 Tổng</td>
                        </tr>
                      </thead>
                      <tbody>
                        {SVC_KEYS.map((s, si) => {
                          const q1 = SERVICE_MONTHLY.reduce((sum, m) => sum + ((isHN ? m.hn : m.hcm) as any)[s.key] as number, 0);
                          return (
                            <tr key={s.key} className={si % 2 === 0 ? "bg-slate-800/30 border-b border-slate-700/30" : "bg-slate-900/20 border-b border-slate-700/30"}>
                              <td className="py-2 px-3 font-semibold text-slate-200" style={{ borderLeft: `3px solid ${s.color}` }}>{s.label}</td>
                              {SERVICE_MONTHLY.map((m) => (
                                <td key={m.month} className={`py-2 px-3 text-right tabular-nums ${cellColor}`}>
                                  {(((isHN ? m.hn : m.hcm) as any)[s.key] as number).toFixed(1)}
                                </td>
                              ))}
                              <td className="py-2 px-3 text-right font-bold tabular-nums text-white">{q1.toFixed(1)}</td>
                            </tr>
                          );
                        })}
                        <tr className="bg-slate-700/40 font-bold">
                          <td className="py-2.5 px-3 text-slate-100 border-l-2 border-slate-500">Tổng cộng</td>
                          {SERVICE_MONTHLY.map((m) => {
                            const tot = SVC_KEYS.reduce((sum, s) => sum + ((isHN ? m.hn : m.hcm) as any)[s.key] as number, 0);
                            return <td key={m.month} className={`py-2.5 px-3 text-right tabular-nums ${totalColor}`}>{tot.toFixed(1)}</td>;
                          })}
                          <td className="py-2.5 px-3 text-right tabular-nums text-white">
                            {SVC_KEYS.reduce((sum, s) => sum + SERVICE_MONTHLY.reduce((s2, m) => s2 + ((isHN ? m.hn : m.hcm) as any)[s.key] as number, 0), 0).toFixed(1)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      {showAI && <AiAnalysisPanel context="overview" data={kpi} onClose={() => setShowAI(false)} />}
    </div>
  );
}
