"use client";

import { useState, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Legend, LabelList, ReferenceLine,
} from "recharts";
import { Header, PageHeader } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Sparkles, History, TrendingUp, TrendingDown, MapPin } from "lucide-react";
import { AiAnalysisPanel } from "@/components/ai/ai-analysis-panel";
import { AiHistoryPanel } from "@/components/ai/ai-history-panel";
import { TEAM_SERVICE_DATA } from "@/lib/mock-data";
import type { UserRole, TeamMonthlyData, TeamServiceRecord } from "@/lib/types";

interface MonthlyRow { month: string; cumKy: number; hn: number | null; hcm: number | null; hnPrev?: number | null; hcmPrev?: number | null; [k: string]: any; }

interface TeamsClientProps {
  role: UserRole;
  teamId: string | null;
  teamServiceData: TeamMonthlyData;
  teamPrevData: TeamMonthlyData;
  monthlyData: MonthlyRow[];
}

const SVC_KEYS: { key: string; label: string; color: string }[] = [
  { key: "hostMail",    label: "Host/Mail",   color: "#60A5FA" },
  { key: "msgws",       label: "MS/GWS",      color: "#34D399" },
  { key: "tenMien",     label: "Tên miền",    color: "#FCD34D" },
  { key: "transferGws", label: "Transfer GWS",color: "#C084FC" },
  { key: "saleAi",      label: "Sale AI",     color: "#F87171" },
  { key: "elastic",     label: "Elastic",     color: "#38BDF8" },
];

const QUARTER_MONTHS: Record<number, string[]> = {
  1: ["T1","T2","T3"], 2: ["T4","T5","T6"],
  3: ["T7","T8","T9"], 4: ["T10","T11","T12"],
};

const TOOLTIP_STYLE = {
  contentStyle: { background: "#0f172a", border: "1px solid #475569", borderRadius: 8, color: "#f8fafc", fontSize: 12 },
  labelStyle: { color: "#94a3b8", fontWeight: 600, marginBottom: 4 },
  itemStyle: { color: "#f8fafc" },
};

function pct(v: number, t: number) { return t > 0 ? Math.round((v / t) * 100) : 0; }

function thresholdColor(p: number) {
  if (p >= 100) return "text-green-400";
  if (p >= 80)  return "text-amber-400";
  if (p >= 60)  return "text-orange-400";
  return "text-red-400";
}

function RegionCard({ label, teams }: { label: string; teams: TeamServiceRecord[] }) {
  const totalRev = teams.reduce((s, t) => s + t.revenue, 0);
  const totalTarget = teams.reduce((s, t) => s + t.target, 0);
  const p = pct(totalRev, totalTarget);
  const isHN = label === "HN";
  return (
    <div className={`rounded-xl border p-4 ${isHN ? "border-blue-500/30 bg-blue-500/5" : "border-orange-500/30 bg-orange-500/5"}`}>
      <div className="flex items-center gap-2 mb-3">
        <MapPin size={14} className={isHN ? "text-blue-400" : "text-orange-400"} />
        <span className="text-sm font-semibold text-white">Khu vực {label}</span>
        <Badge variant="neutral">{teams.length} team</Badge>
      </div>
      <div className={`text-2xl font-bold ${isHN ? "text-blue-400" : "text-orange-400"}`}>
        {totalRev.toLocaleString()}M
      </div>
      <div className="text-xs text-slate-400 mt-1">Mục tiêu: {totalTarget.toLocaleString()}M</div>
      <div className="flex items-center gap-1.5 mt-2">
        {p >= 100 ? <TrendingUp size={12} className="text-green-400" /> : <TrendingDown size={12} className="text-red-400" />}
        <span className={`text-xs font-semibold ${thresholdColor(p)}`}>Đạt {p}% mục tiêu</span>
      </div>
    </div>
  );
}

export function TeamsClient({ role, teamId, teamServiceData, teamPrevData, monthlyData }: TeamsClientProps) {
  const [showAI, setShowAI] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [region, setRegion] = useState<"all" | "HN" | "HCM">("all");
  const [view, setView] = useState<"month" | "quarter">("month");
  const [selectedMonth, setSelectedMonth] = useState(`T${new Date().getMonth() + 1}`);
  const [selectedQuarter, setSelectedQuarter] = useState(1);
  const [openDropdown, setOpenDropdown] = useState<"month" | "quarter" | null>(null);
  const [benchmark, setBenchmark] = useState(40);
  const rankingRef = useRef<HTMLDivElement>(null);

  const allMonths = teamServiceData.length > 0 ? teamServiceData : TEAM_SERVICE_DATA;
  const allPrevMonths = teamPrevData.length > 0 ? teamPrevData : [];

  // Aggregate teams cho 1 tháng hoặc 1 quý từ một dataset
  function getTeamsForMonths(monthKeys: string[], source = allMonths) {
    const map: Record<string, import("@/lib/types").TeamServiceRecord> = {};
    for (const mk of monthKeys) {
      const teams = source.find(m => m.month === mk)?.teams ?? [];
      for (const t of teams) {
        if (!map[t.teamId]) {
          map[t.teamId] = { ...t, revenue: 0, target: 0, customerCount: 0, hostMail: 0, msgws: 0, tenMien: 0, transferGws: 0, saleAi: 0, elastic: 0 };
        }
        map[t.teamId].revenue        += t.revenue;
        map[t.teamId].target         += t.target;
        map[t.teamId].customerCount  += (t.customerCount ?? 0);
        map[t.teamId].hostMail       += t.hostMail;
        map[t.teamId].msgws       += t.msgws;
        map[t.teamId].tenMien     += t.tenMien;
        map[t.teamId].transferGws += t.transferGws;
        map[t.teamId].saleAi      += t.saleAi;
        map[t.teamId].elastic     += t.elastic;
      }
    }
    return Object.values(map);
  }

  const monthKeys = view === "month" ? [selectedMonth] : QUARTER_MONTHS[selectedQuarter];
  const allTeams = getTeamsForMonths(monthKeys);
  const prevYearTeams = allPrevMonths.length > 0 ? getTeamsForMonths(monthKeys, allPrevMonths) : [];

  // Map teamId → prev year data for quick lookup
  const prevYearTeamMap = Object.fromEntries(prevYearTeams.map(t => [t.teamId, t]));
  const hasPrevYearTeamData = prevYearTeams.some(t => t.revenue > 0 || SVC_KEYS.some(s => (t as any)[s.key] > 0));

  // Cùng kỳ 2025 từ monthly_data (tỷ → triệu *1000)
  const getMonthRow = (mk: string) => monthlyData.find(m => m.month === mk);
  const prevYearRev = view === "month"
    ? ((getMonthRow(selectedMonth)?.cumKy ?? null) !== null ? (getMonthRow(selectedMonth)!.cumKy * 1000) : null)
    : (() => {
        const sum = QUARTER_MONTHS[selectedQuarter].reduce((s, mk) => s + (getMonthRow(mk)?.cumKy ?? 0), 0);
        return sum > 0 ? sum * 1000 : null;
      })();
  const prevYearHnRev = view === "month"
    ? ((getMonthRow(selectedMonth)?.hnPrev ?? null) !== null ? ((getMonthRow(selectedMonth)!.hnPrev ?? 0) * 1000) : null)
    : (() => {
        const sum = QUARTER_MONTHS[selectedQuarter].reduce((s, mk) => s + (getMonthRow(mk)?.hnPrev ?? 0), 0);
        return sum > 0 ? sum * 1000 : null;
      })();
  const prevYearHcmRev = view === "month"
    ? ((getMonthRow(selectedMonth)?.hcmPrev ?? null) !== null ? ((getMonthRow(selectedMonth)!.hcmPrev ?? 0) * 1000) : null)
    : (() => {
        const sum = QUARTER_MONTHS[selectedQuarter].reduce((s, mk) => s + (getMonthRow(mk)?.hcmPrev ?? 0), 0);
        return sum > 0 ? sum * 1000 : null;
      })();

  // Kỳ trước để so sánh (tháng trước / quý trước)
  const prevTeams = (() => {
    if (view === "month") {
      const idx = parseInt(selectedMonth.replace("T","")) - 1;
      if (idx <= 0) return [];
      return getTeamsForMonths([`T${idx}`]);
    } else {
      const prevQ = selectedQuarter - 1;
      if (prevQ <= 0) return [];
      return getTeamsForMonths(QUARTER_MONTHS[prevQ]);
    }
  })();

  const prevLabel = view === "month"
    ? (parseInt(selectedMonth.replace("T","")) > 1 ? `T${parseInt(selectedMonth.replace("T","")) - 1}` : null)
    : (selectedQuarter > 1 ? `Q${selectedQuarter - 1}` : null);

  const hnTeams  = allTeams.filter(t => t.region === "HN");
  const hcmTeams = allTeams.filter(t => t.region === "HCM");
  const displayed = region === "all" ? allTeams : allTeams.filter(t => t.region === region);

  const filterLabel = view === "month" ? selectedMonth : `Q${selectedQuarter}`;

  // Ranking chart data
  const rankingData = [...displayed]
    .sort((a, b) => b.revenue - a.revenue)
    .map(t => {
      const prev = prevYearTeamMap[t.teamId];
      const dsYoy = (t.revenue > 0 && prev && prev.revenue > 0) ? ((t.revenue - prev.revenue) / prev.revenue * 100) : null;
      return {
        name: t.teamName,
        revenue: t.revenue,
        target: t.target,
        pct: pct(t.revenue, t.target),
        dkmYoy: dsYoy,
        color: t.region === "HN" ? "#3b82f6" : "#f97316",
      };
    });

  // Heatmap: team × service
  const hasData = allTeams.some(t => t.revenue > 0);

  // Grouped bar: each group = 1 service, bars = teams — sort by teamId để đúng thứ tự nhập
  const displayedSorted = [...displayed].sort((a, b) => a.teamId.localeCompare(b.teamId));
  const serviceCompareData = SVC_KEYS.map(s => {
    const entry: Record<string, any> = { service: s.label };
    displayedSorted.forEach(t => { entry[t.teamName] = (t as any)[s.key] ?? 0; });
    return entry;
  });

  // Radar chart per region
  const radarHN = SVC_KEYS.map(s => ({
    subject: s.label,
    value: hnTeams.reduce((sum, t) => sum + ((t as any)[s.key] ?? 0), 0),
  }));
  const radarHCM = SVC_KEYS.map(s => ({
    subject: s.label,
    value: hcmTeams.reduce((sum, t) => sum + ((t as any)[s.key] ?? 0), 0),
  }));
  const radarData = SVC_KEYS.map((s, i) => ({
    subject: s.label,
    HN:  radarHN[i].value,
    HCM: radarHCM[i].value,
  }));

  const TEAM_COLORS = ["#3b82f6","#10b981","#f59e0b","#8b5cf6","#ef4444","#06b6d4","#f97316","#ec4899"];

  return (
    <div>
      <Header title="Chi Tiết Doanh Số">
        <Button variant="ghost" size="sm" onClick={() => setShowHistory(true)}>
          <History size={14} /> Lịch Sử AI
        </Button>
        <Button variant="primary" size="sm" onClick={() => setShowAI(true)}>
          <Sparkles size={14} /> Trợ Lý AI
        </Button>
      </Header>

      <div className="p-6 space-y-5">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-slate-400 font-medium">Bộ lọc:</span>

          {/* Dropdown Tháng */}
          <div className="relative">
            <button onClick={() => setOpenDropdown(d => d === "month" ? null : "month")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${view === "month" ? "bg-blue-600 border-blue-500 text-white" : "bg-slate-700 border-slate-600 text-slate-400 hover:text-white"}`}>
              {view === "month" ? `Tháng: ${selectedMonth}` : "Tháng"}
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 3.5l3 3 3-3"/></svg>
            </button>
            {openDropdown === "month" && (
              <div className="absolute top-full mt-1 left-0 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 p-2 grid grid-cols-4 gap-1 w-44">
                {Array.from({ length: 12 }, (_, i) => `T${i + 1}`).map(m => (
                  <button key={m} onClick={() => { setSelectedMonth(m); setView("month"); setOpenDropdown(null); }}
                    className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${view === "month" && selectedMonth === m ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-700 hover:text-white"}`}>
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Dropdown Quý */}
          <div className="relative">
            <button onClick={() => setOpenDropdown(d => d === "quarter" ? null : "quarter")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${view === "quarter" ? "bg-purple-600 border-purple-500 text-white" : "bg-slate-700 border-slate-600 text-slate-400 hover:text-white"}`}>
              {view === "quarter" ? `Quý: Q${selectedQuarter}` : "Quý"}
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 3.5l3 3 3-3"/></svg>
            </button>
            {openDropdown === "quarter" && (
              <div className="absolute top-full mt-1 left-0 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 p-2 flex flex-col gap-1 w-36">
                {[1,2,3,4].map(q => (
                  <button key={q} onClick={() => { setSelectedQuarter(q); setView("quarter"); setOpenDropdown(null); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium text-left transition-colors ${view === "quarter" && selectedQuarter === q ? "bg-purple-600 text-white" : "text-slate-400 hover:bg-slate-700 hover:text-white"}`}>
                    Q{q} ({["T1-T3","T4-T6","T7-T9","T10-T12"][q-1]})
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="h-4 w-px bg-slate-700" />

          {/* Region filter */}
          <div className="flex gap-1">
            {(["all","HN","HCM"] as const).map(r => (
              <button key={r} onClick={() => setRegion(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${region === r ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-400 hover:text-white"}`}>
                {r === "all" ? "Toàn Quốc" : `Khu vực ${r}`}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-500 ml-auto">
            {view === "month" ? selectedMonth : `Q${selectedQuarter} (${QUARTER_MONTHS[selectedQuarter].join(", ")})`}
          </span>
        </div>

        {openDropdown && (
          <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
        )}

        <PageHeader title="Chi Tiết Doanh Số theo Team"
          subtitle={`So sánh hiệu suất và cơ cấu dịch vụ giữa các team HN & HCM`} />

        {!hasData && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-amber-400 text-sm">
            ⚠️ Chưa có dữ liệu team — Anh vào <strong>Nhập Dữ Liệu → Tab Doanh Số Team</strong> để nhập số liệu thực tế.
          </div>
        )}

        {/* Phần 1: KPI Tổng + Vùng */}
        {(() => {
          const totalRev    = allTeams.reduce((s, t) => s + t.revenue, 0);
          const totalTarget = allTeams.reduce((s, t) => s + t.target, 0);
          const totalPct    = pct(totalRev, totalTarget);
          const prevRev     = prevTeams.reduce((s, t) => s + t.revenue, 0);
          const momDiff     = prevRev > 0 ? ((totalRev - prevRev) / prevRev * 100) : null;
          const yoyDiff     = prevYearRev != null && prevYearRev > 0 ? ((totalRev - prevYearRev) / prevYearRev * 100) : null;
          const hnRev       = hnTeams.reduce((s, t) => s + t.revenue, 0);
          const hcmRev      = hcmTeams.reduce((s, t) => s + t.revenue, 0);
          const hnShare     = totalRev > 0 ? Math.round((hnRev / totalRev) * 100) : 0;
          const hcmShare    = totalRev > 0 ? Math.round((hcmRev / totalRev) * 100) : 0;
          const prevHnRev   = prevTeams.filter(t => t.region === "HN").reduce((s, t) => s + t.revenue, 0);
          const prevHcmRev  = prevTeams.filter(t => t.region === "HCM").reduce((s, t) => s + t.revenue, 0);
          const hnMom       = prevHnRev > 0 ? ((hnRev - prevHnRev) / prevHnRev * 100) : null;
          const hcmMom      = prevHcmRev > 0 ? ((hcmRev - prevHcmRev) / prevHcmRev * 100) : null;
          const hnYoy       = prevYearHnRev != null && prevYearHnRev > 0 ? ((hnRev - prevYearHnRev) / prevYearHnRev * 100) : null;
          const hcmYoy      = prevYearHcmRev != null && prevYearHcmRev > 0 ? ((hcmRev - prevYearHcmRev) / prevYearHcmRev * 100) : null;
          return (
            <div className="rounded-xl border border-slate-600/50 bg-slate-800/40 p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">
                      Tổng Doanh Số Toàn Quốc — {view === "month" ? selectedMonth : `Q${selectedQuarter}`}
                    </span>
                    {momDiff !== null && prevLabel && (
                      <span className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${momDiff >= 0 ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"}`}>
                        {momDiff >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {momDiff >= 0 ? "+" : ""}{momDiff.toFixed(1)}% so với {prevLabel}
                      </span>
                    )}
                    {yoyDiff !== null && (
                      <span className={`flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${yoyDiff >= 0 ? "bg-blue-500/15 text-blue-300" : "bg-red-500/15 text-red-400"}`}>
                        {yoyDiff >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {yoyDiff >= 0 ? "+" : ""}{yoyDiff.toFixed(1)}% so cùng kỳ 2025
                      </span>
                    )}
                  </div>
                  <div className="text-4xl font-bold text-white">{totalRev.toLocaleString()}<span className="text-xl text-slate-400 ml-1">M</span></div>
                  <div className="text-sm text-slate-400 mt-1 flex flex-wrap gap-x-4 gap-y-0.5">
                    <span>Mục tiêu: <span className="text-white font-medium">{totalTarget.toLocaleString()}M</span></span>
                    {prevRev > 0 && prevLabel && (
                      <span>Kỳ trước ({prevLabel}): <span className="text-slate-300">{prevRev.toLocaleString()}M</span></span>
                    )}
                    {prevYearRev != null && prevYearRev > 0 && (
                      <span>Cùng kỳ 2025: <span className="text-slate-300">{prevYearRev.toLocaleString()}M</span></span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-bold ${thresholdColor(totalPct)}`}>{totalPct}%</div>
                  <div className="text-xs text-slate-400 mt-1">Đạt mục tiêu</div>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    {totalPct >= 100
                      ? <TrendingUp size={14} className="text-green-400" />
                      : <TrendingDown size={14} className="text-red-400" />}
                    <span className={`text-xs font-semibold ${thresholdColor(totalPct)}`}>
                      {totalPct >= 100 ? "Đạt chỉ tiêu" : `Còn thiếu ${(totalTarget - totalRev).toLocaleString()}M`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress bar tổng */}
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-4">
                <div className={`h-full rounded-full transition-all ${totalPct >= 100 ? "bg-green-500" : totalPct >= 80 ? "bg-amber-500" : totalPct >= 60 ? "bg-orange-500" : "bg-red-500"}`}
                  style={{ width: `${Math.min(totalPct, 100)}%` }} />
              </div>

              {/* HN vs HCM split */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <MapPin size={11} className="text-blue-400" />
                    <span className="text-xs font-semibold text-blue-400">Khu vực HN</span>
                    <span className="ml-auto text-xs text-slate-500">{hnShare}% tổng</span>
                  </div>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <div className="text-xl font-bold text-white">{hnRev.toLocaleString()}<span className="text-sm text-slate-400 ml-1">M</span></div>
                    {hnMom !== null && prevLabel && (
                      <span className={`text-xs font-semibold ${hnMom >= 0 ? "text-green-400" : "text-red-400"}`} title={`So với ${prevLabel}`}>
                        {hnMom >= 0 ? "+" : ""}{hnMom.toFixed(1)}% vs {prevLabel}
                      </span>
                    )}
                    {hnYoy !== null && (
                      <span className={`flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full ${hnYoy >= 0 ? "bg-blue-500/15 text-blue-300" : "bg-red-500/15 text-red-400"}`}>
                        {hnYoy >= 0 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                        {hnYoy >= 0 ? "+" : ""}{hnYoy.toFixed(1)}% CK25
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-xs text-slate-400">{hnTeams.length} team · MT: {hnTeams.reduce((s,t)=>s+t.target,0).toLocaleString()}M</span>
                    <span className={`text-xs font-bold ${thresholdColor(pct(hnRev, hnTeams.reduce((s,t)=>s+t.target,0)))}`}>
                      Đạt {pct(hnRev, hnTeams.reduce((s,t)=>s+t.target,0))}% MT
                    </span>
                  </div>
                  <div className="mt-1.5 h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(pct(hnRev, hnTeams.reduce((s,t)=>s+t.target,0)), 100)}%` }} />
                  </div>
                </div>
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <MapPin size={11} className="text-orange-400" />
                    <span className="text-xs font-semibold text-orange-400">Khu vực HCM</span>
                    <span className="ml-auto text-xs text-slate-500">{hcmShare}% tổng</span>
                  </div>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <div className="text-xl font-bold text-white">{hcmRev.toLocaleString()}<span className="text-sm text-slate-400 ml-1">M</span></div>
                    {hcmMom !== null && prevLabel && (
                      <span className={`text-xs font-semibold ${hcmMom >= 0 ? "text-green-400" : "text-red-400"}`} title={`So với ${prevLabel}`}>
                        {hcmMom >= 0 ? "+" : ""}{hcmMom.toFixed(1)}% vs {prevLabel}
                      </span>
                    )}
                    {hcmYoy !== null && (
                      <span className={`flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full ${hcmYoy >= 0 ? "bg-blue-500/15 text-blue-300" : "bg-red-500/15 text-red-400"}`}>
                        {hcmYoy >= 0 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                        {hcmYoy >= 0 ? "+" : ""}{hcmYoy.toFixed(1)}% CK25
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-xs text-slate-400">{hcmTeams.length} team · MT: {hcmTeams.reduce((s,t)=>s+t.target,0).toLocaleString()}M</span>
                    <span className={`text-xs font-bold ${thresholdColor(pct(hcmRev, hcmTeams.reduce((s,t)=>s+t.target,0)))}`}>
                      Đạt {pct(hcmRev, hcmTeams.reduce((s,t)=>s+t.target,0))}% MT
                    </span>
                  </div>
                  <div className="mt-1.5 h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: `${Math.min(pct(hcmRev, hcmTeams.reduce((s,t)=>s+t.target,0)), 100)}%` }} />
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Phần 2: Bảng xếp hạng team */}
        <Card>
          <CardHeader>
            <CardTitle>Xếp Hạng Doanh Số Các Team</CardTitle>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-blue-500 inline-block"/>HN</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-orange-500 inline-block"/>HCM</span>
            </div>
          </CardHeader>
          <CardContent>
            {rankingData.length === 0 || !hasData ? (
              <div className="text-center text-slate-500 py-10 text-sm">Chưa có dữ liệu</div>
            ) : (() => {
              const RIGHT_MARGIN = hasPrevYearTeamData ? 140 : 70;
              const PCT_COL_W = 44;   // width reserved for pct label
              const YOY_COL_W = 60;   // width reserved for yoy label
              return (
                <div ref={rankingRef}>
                  <ResponsiveContainer width="100%" height={Math.max(200, rankingData.length * 52)}>
                    <BarChart data={rankingData} layout="vertical" margin={{ left: 16, right: RIGHT_MARGIN }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                      <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={v => `${v.toLocaleString()}M`} />
                      <YAxis type="category" dataKey="name" tick={{ fill: "#cbd5e1", fontSize: 12 }} width={90} />
                      <Tooltip {...TOOLTIP_STYLE} formatter={(v: any) => [`${Number(v).toLocaleString()}M`, "Doanh số"]} />
                      <Bar dataKey="revenue" radius={[0, 6, 6, 0]}>
                        <LabelList dataKey="pct" position="right" content={(props: any) => {
                          const { y, height, value, viewBox } = props;
                          const chartRightEdge = (viewBox?.width ?? 0) + (viewBox?.x ?? 0);
                          const x = chartRightEdge + 4;
                          const color = value >= 100 ? "#4ade80" : "#f87171";
                          return <text x={x} y={y + height / 2 + 4} fill={color} fontSize={11} fontWeight={600} textAnchor="start">{value}%</text>;
                        }} />
                        {hasPrevYearTeamData && (
                          <LabelList dataKey="dkmYoy" position="right" content={(props: any) => {
                            const { y, height, value, viewBox } = props;
                            if (value == null) return null;
                            const chartRightEdge = (viewBox?.width ?? 0) + (viewBox?.x ?? 0);
                            const x = chartRightEdge + PCT_COL_W + 4;
                            const color = value >= 0 ? "#34d399" : "#f87171";
                            const sign = value >= 0 ? "▲" : "▼";
                            return <text x={x} y={y + height / 2 + 4} fill={color} fontSize={10} fontWeight={700} textAnchor="start">{sign}{Math.abs(value).toFixed(1)}%</text>;
                          }} />
                        )}
                        {rankingData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Phần 3: Radar + Top Team per Service */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Radar: Thế Mạnh Dịch Vụ Đăng Ký Mới HN vs HCM</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <PolarRadiusAxis tick={{ fill: "#475569", fontSize: 9 }} />
                  <Radar name="HN" dataKey="HN" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                  <Radar name="HCM" dataKey="HCM" stroke="#f97316" fill="#f97316" fillOpacity={0.3} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Tooltip {...TOOLTIP_STYLE} formatter={(v: any) => [`${Number(v).toLocaleString()}M`]} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top team per service */}
          <Card>
            <CardHeader>
              <CardTitle>Team Dẫn Đầu Từng Dịch Vụ Đăng Ký Mới</CardTitle>
              <span className="text-xs text-slate-500">
                {region === "all" ? "Tất cả khu vực" : `Khu vực ${region}`} · {view === "month" ? selectedMonth : `Q${selectedQuarter}`}
              </span>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5">
                {SVC_KEYS.map(s => {
                  const top = displayed.length > 0
                    ? displayed.reduce((best, t) => ((t as any)[s.key] ?? 0) > ((best as any)[s.key] ?? 0) ? t : best, displayed[0])
                    : null;
                  const topVal = top ? ((top as any)[s.key] ?? 0) : 0;
                  const maxVal = displayed.length > 0 ? Math.max(...displayed.map(t => (t as any)[s.key] ?? 0)) : 1;
                  const barW = maxVal > 0 ? Math.round((topVal / maxVal) * 100) : 0;
                  const r = parseInt(s.color.slice(1,3),16);
                  const g = parseInt(s.color.slice(3,5),16);
                  const b = parseInt(s.color.slice(5,7),16);
                  return (
                    <div key={s.key} className="flex items-center gap-3">
                      <div className="w-24 text-xs font-medium shrink-0" style={{ color: s.color }}>{s.label}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs text-white font-semibold">
                            {top && topVal > 0 ? top.teamName : "—"}
                          </span>
                          <span className="text-xs font-mono" style={{ color: s.color }}>
                            {topVal > 0 ? `${topVal.toLocaleString()}M` : "—"}
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${barW}%`, background: `rgba(${r},${g},${b},0.7)` }} />
                        </div>
                      </div>
                      <div className="w-8 text-right text-xs text-slate-500 shrink-0">
                        {top?.region && topVal > 0 ? (
                          <span className={`px-1 py-0.5 rounded text-xs font-medium ${top.region === "HN" ? "text-blue-400" : "text-orange-400"}`}>
                            {top.region}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Phần 3b: Xu Hướng Nhóm Sản Phẩm */}
        {(() => {
          const MONTHS_ORDER = ["T1","T2","T3","T4","T5","T6","T7","T8","T9","T10","T11","T12"];
          const regionSource = (source: TeamMonthlyData) =>
            source.map(m => ({
              ...m,
              teams: region === "all" ? m.teams : m.teams.filter(t => t.region === region),
            }));
          const src     = regionSource(allMonths);
          const srcPrev = regionSource(allPrevMonths);

          const monthsWithData = MONTHS_ORDER.filter(mk =>
            src.find(m => m.month === mk)?.teams.some(t =>
              SVC_KEYS.some(s => (t as any)[s.key] > 0)
            )
          );
          if (monthsWithData.length === 0) return null;

          function svcSum(monthKey: string, svcKey: string, source: TeamMonthlyData) {
            return (source.find(m => m.month === monthKey)?.teams ?? [])
              .reduce((s, t) => s + ((t as any)[svcKey] ?? 0), 0);
          }

          const lastIdx   = monthsWithData.length - 1;
          const curMk     = monthsWithData[lastIdx];
          const prevMk    = lastIdx > 0 ? monthsWithData[lastIdx - 1] : null;
          const sparkMonths = monthsWithData.slice(-6);

          const trendRows = SVC_KEYS.map(s => {
            const sparkVals = sparkMonths.map(mk => svcSum(mk, s.key, src));
            const cur       = svcSum(curMk,  s.key, src);
            const prev      = prevMk ? svcSum(prevMk, s.key, src) : null;
            const prevYear  = svcSum(curMk,  s.key, srcPrev);
            const mom = (cur > 0 && prev != null && prev > 0) ? ((cur - prev) / prev * 100) : null;
            const yoy = (cur > 0 && prevYear > 0)             ? ((cur - prevYear) / prevYear * 100) : null;
            const status: "spike" | "up" | "stable" | "down" =
              mom === null   ? "stable"
              : mom > 50    ? "spike"
              : mom > 10    ? "up"
              : mom < -10   ? "down"
              : "stable";
            return { ...s, sparkVals, cur, prev, prevYear, mom, yoy, status };
          });

          const maxSpark = Math.max(...trendRows.flatMap(r => r.sparkVals), 1);

          function Sparkline({ vals, color }: { vals: number[]; color: string }) {
            const h = 28, w = 72, n = vals.length;
            if (n < 2) return <span className="text-slate-600 text-xs">—</span>;
            const pts = vals.map((v, i) => {
              const x = (i / (n - 1)) * w;
              const y = h - (v / maxSpark) * h;
              return `${x},${y}`;
            }).join(" ");
            return (
              <svg width={w} height={h} className="inline-block">
                <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5"
                  strokeLinejoin="round" strokeLinecap="round" opacity={0.8} />
                {vals[n-1] > 0 && (
                  <circle cx={(n-1)/(n-1)*w} cy={h-(vals[n-1]/maxSpark)*h} r="2.5" fill={color} />
                )}
              </svg>
            );
          }

          function StatusBadge({ status, mom }: { status: string; mom: number | null }) {
            const cfg = {
              spike:  { icon: "🚀", label: "Đột biến", cls: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
              up:     { icon: "▲",  label: "Tăng",     cls: "bg-green-500/20  text-green-300  border-green-500/30"  },
              stable: { icon: "●",  label: "Ổn định",  cls: "bg-slate-500/20  text-slate-400  border-slate-500/30"  },
              down:   { icon: "▼",  label: "Giảm",     cls: "bg-red-500/20    text-red-300    border-red-500/30"    },
            }[status] ?? { icon: "●", label: "—", cls: "bg-slate-500/20 text-slate-400 border-slate-500/30" };
            return (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium ${cfg.cls}`}>
                {cfg.icon} {mom !== null ? `${mom > 0 ? "+" : ""}${mom.toFixed(0)}%` : cfg.label}
              </span>
            );
          }

          function YoyCell({ yoy }: { yoy: number | null }) {
            if (yoy === null) return <span className="text-slate-600">—</span>;
            return (
              <span className={`text-xs font-semibold ${yoy >= 0 ? "text-green-400" : "text-red-400"}`}>
                {yoy >= 0 ? "▲" : "▼"}{Math.abs(yoy).toFixed(0)}%
              </span>
            );
          }

          return (
            <Card>
              <CardHeader>
                <CardTitle>Xu Hướng Nhóm Sản Phẩm — Đăng Ký Mới</CardTitle>
                <div className="text-xs text-slate-400">
                  So sánh {curMk}{prevMk ? ` vs ${prevMk}` : ""} · Sparkline {sparkMonths[0]}–{curMk}
                  {region !== "all" && <span className="ml-2 text-blue-400">Khu vực {region}</span>}
                </div>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-xs" style={{ minWidth: 560 }}>
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-2 px-3 text-slate-400 w-28">Nhóm SP</th>
                      <th className="text-center py-2 px-3 text-slate-400">Xu hướng</th>
                      <th className="text-right py-2 px-3 text-slate-300 font-medium">{curMk} (M)</th>
                      {prevMk && <th className="text-right py-2 px-3 text-slate-400">{prevMk} (M)</th>}
                      <th className="text-right py-2 px-3 text-amber-400 font-medium">MoM</th>
                      <th className="text-right py-2 px-3 text-purple-400 font-medium">YoY 2025</th>
                      <th className="text-center py-2 px-3 text-slate-400">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trendRows
                      .sort((a, b) => (b.mom ?? -999) - (a.mom ?? -999))
                      .map(r => (
                      <tr key={r.key} className="border-b border-slate-800 hover:bg-slate-800/30">
                        <td className="py-2.5 px-3 font-semibold" style={{ color: r.color }}>{r.label}</td>
                        <td className="py-2.5 px-3 text-center">
                          <Sparkline vals={r.sparkVals} color={r.color} />
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-white tabular-nums">
                          {r.cur > 0 ? r.cur.toLocaleString() : "—"}
                        </td>
                        {prevMk && (
                          <td className="py-2.5 px-3 text-right text-slate-400 tabular-nums">
                            {r.prev != null && r.prev > 0 ? r.prev.toLocaleString() : "—"}
                          </td>
                        )}
                        <td className="py-2.5 px-3 text-right">
                          {r.mom !== null
                            ? <span className={`font-semibold ${r.mom >= 0 ? "text-green-400" : "text-red-400"}`}>
                                {r.mom >= 0 ? "+" : ""}{r.mom.toFixed(1)}%
                              </span>
                            : <span className="text-slate-600">—</span>}
                        </td>
                        <td className="py-2.5 px-3 text-right"><YoyCell yoy={r.yoy} /></td>
                        <td className="py-2.5 px-3 text-center"><StatusBadge status={r.status} mom={r.mom} /></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-600 bg-slate-800/50">
                      <td className="py-2 px-3 font-bold text-white">TỔNG ĐKM</td>
                      <td />
                      <td className="py-2 px-3 text-right font-bold text-white tabular-nums">
                        {trendRows.reduce((s,r) => s + r.cur, 0).toLocaleString()}
                      </td>
                      {prevMk && (
                        <td className="py-2 px-3 text-right font-semibold text-slate-400 tabular-nums">
                          {trendRows.reduce((s,r) => s + (r.prev ?? 0), 0).toLocaleString()}
                        </td>
                      )}
                      {(() => {
                        const totCur  = trendRows.reduce((s,r) => s + r.cur, 0);
                        const totPrev = trendRows.reduce((s,r) => s + (r.prev ?? 0), 0);
                        const totYoy  = trendRows.reduce((s,r) => s + r.prevYear, 0);
                        const momTot  = totPrev > 0 ? ((totCur - totPrev) / totPrev * 100) : null;
                        const yoyTot  = totYoy  > 0 ? ((totCur - totYoy)  / totYoy  * 100) : null;
                        return (
                          <>
                            <td className="py-2 px-3 text-right">
                              {momTot !== null
                                ? <span className={`font-bold ${momTot >= 0 ? "text-green-400" : "text-red-400"}`}>
                                    {momTot >= 0 ? "+" : ""}{momTot.toFixed(1)}%
                                  </span>
                                : <span className="text-slate-600">—</span>}
                            </td>
                            <td className="py-2 px-3 text-right"><YoyCell yoy={yoyTot} /></td>
                            <td />
                          </>
                        );
                      })()}
                    </tr>
                  </tfoot>
                </table>
              </CardContent>
            </Card>
          );
        })()}

        {/* Phần 4: Heatmap team × dịch vụ */}
        <Card>
          <CardHeader>
            <CardTitle>Ma Trận Doanh Số Đăng Ký Mới theo Loại Dịch Vụ (triệu VNĐ)</CardTitle>
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="neutral">Màu càng sáng = doanh số càng cao</Badge>
              <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1">
                <span className="text-xs text-slate-400">Benchmark tỉ lệ ĐKM:</span>
                <input
                  type="number" min={0} max={100} step={1}
                  value={benchmark}
                  onChange={e => setBenchmark(Math.max(0, Math.min(100, Number(e.target.value))))}
                  className="w-12 bg-transparent text-xs text-white font-semibold text-right focus:outline-none"
                />
                <span className="text-xs text-slate-400">%</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block"/>≥ {benchmark}% đạt</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block"/>{"<"} {benchmark}% chưa đạt</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2 px-3 text-slate-400 w-28">Team</th>
                  <th className="text-center py-2 px-2 text-slate-400">Vùng</th>
                  {SVC_KEYS.map(s => (
                    <th key={s.key} className="text-right py-2 px-3 text-slate-400 font-medium">{s.label}</th>
                  ))}
                  <th className="text-right py-2 px-3 text-slate-400 font-medium">Tổng ĐKM</th>
                  <th className="text-right py-2 px-3 text-slate-400 font-medium">Tỉ lệ ĐKM/DS</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const maxSvc: Record<string, number> = {};
                  SVC_KEYS.forEach(s => {
                    maxSvc[s.key] = Math.max(...displayed.map(t => (t as any)[s.key] ?? 0), 1);
                  });
                  return displayed.map((team) => {
                    const svcTotal = SVC_KEYS.reduce((sum, s) => sum + ((team as any)[s.key] ?? 0), 0);
                    const ratio = team.revenue > 0 ? Math.round((svcTotal / team.revenue) * 100) : 0;
                    const prev = prevYearTeamMap[team.teamId];
                    const prevSvcTotal = SVC_KEYS.reduce((sum, s) => sum + ((prev as any)?.[s.key] ?? 0), 0);
                    const dkmYoy = (svcTotal > 0 && prevSvcTotal > 0) ? ((svcTotal - prevSvcTotal) / prevSvcTotal * 100) : null;
                    return (
                      <tr key={team.teamId} className="border-b border-slate-800 hover:bg-slate-800/30">
                        <td className="py-2 px-3 text-white font-medium">{team.teamName}</td>
                        <td className="py-2 px-2 text-center">
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${team.region === "HN" ? "bg-blue-500/20 text-blue-400" : "bg-orange-500/20 text-orange-400"}`}>
                            {team.region}
                          </span>
                        </td>
                        {SVC_KEYS.map(s => {
                          const val = (team as any)[s.key] ?? 0;
                          const prevVal = prev ? ((prev as any)[s.key] ?? 0) : 0;
                          const svcYoy = (val > 0 && prevVal > 0) ? ((val - prevVal) / prevVal * 100) : null;
                          const intensity = maxSvc[s.key] > 0 ? val / maxSvc[s.key] : 0;
                          const r = parseInt(s.color.slice(1,3),16);
                          const g = parseInt(s.color.slice(3,5),16);
                          const b = parseInt(s.color.slice(5,7),16);
                          return (
                            <td key={s.key} className="py-2 px-3 text-right font-mono"
                              style={{ color: `rgba(${r},${g},${b},${0.45 + intensity * 0.55})` }}>
                              <div className="text-sm font-semibold">{val > 0 ? val.toLocaleString() : "—"}</div>
                              {hasPrevYearTeamData && svcYoy !== null && (
                                <div className={`text-[11px] font-medium ${svcYoy >= 0 ? "text-green-400" : "text-red-400"}`}>
                                  {svcYoy >= 0 ? "▲" : "▼"}{Math.abs(svcYoy).toFixed(0)}%
                                </div>
                              )}
                            </td>
                          );
                        })}
                        <td className="py-2 px-3 text-right font-semibold text-white">
                          <div className="text-sm">{svcTotal > 0 ? svcTotal.toLocaleString() : "—"}</div>
                          {hasPrevYearTeamData && dkmYoy !== null && (
                            <div className={`text-[11px] font-medium mt-0.5 ${dkmYoy >= 0 ? "text-green-400" : "text-red-400"}`}>
                              {dkmYoy >= 0 ? "▲" : "▼"}{Math.abs(dkmYoy).toFixed(1)}%
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right">
                          {team.revenue > 0 ? (
                            <span className={`font-bold ${ratio >= benchmark ? "text-green-400" : "text-red-400"}`}>
                              {ratio}%
                              <span className="ml-1 text-xs font-normal opacity-70">
                                {ratio >= benchmark ? "✓" : `↓${benchmark - ratio}%`}
                              </span>
                            </span>
                          ) : "—"}
                        </td>
                      </tr>
                    );
                  });
                })()}
                {/* HN / HCM / Tổng summary rows */}
                {(["HN","HCM","all"] as const).map(reg => {
                  const regTeams = reg === "all" ? displayed : displayed.filter(t => t.region === reg);
                  if (regTeams.length === 0) return null;
                  const regDs = regTeams.reduce((s, t) => s + t.revenue, 0);
                  const regSvc = regTeams.reduce((sum, t) => sum + SVC_KEYS.reduce((s, sk) => s + ((t as any)[sk.key] ?? 0), 0), 0);
                  const prevRegSvc = regTeams.reduce((sum, t) => sum + SVC_KEYS.reduce((s, sk) => s + ((prevYearTeamMap[t.teamId] as any)?.[sk.key] ?? 0), 0), 0);
                  const regRatio = regDs > 0 ? Math.round((regSvc / regDs) * 100) : 0;
                  const regDkmYoy = (regSvc > 0 && prevRegSvc > 0) ? ((regSvc - prevRegSvc) / prevRegSvc * 100) : null;
                  const isTotal = reg === "all";
                  const labelColor = reg === "HN" ? "text-blue-300" : reg === "HCM" ? "text-orange-300" : "text-white";
                  const rowBg = reg === "HN" ? "bg-blue-900/20 border-blue-500/30" : reg === "HCM" ? "bg-orange-900/20 border-orange-500/30" : "bg-slate-800/50 border-slate-600";
                  return (
                    <tr key={reg} className={`border-t-2 ${rowBg}`}>
                      <td className={`py-2 px-3 font-bold text-xs ${labelColor}`} colSpan={2}>
                        {isTotal ? "TỔNG" : `Khu vực ${reg}`}
                      </td>
                      {SVC_KEYS.map(s => {
                        const colTotal = regTeams.reduce((sum, t) => sum + ((t as any)[s.key] ?? 0), 0);
                        const colPrev = regTeams.reduce((sum, t) => sum + ((prevYearTeamMap[t.teamId] as any)?.[s.key] ?? 0), 0);
                        const colYoy = (colTotal > 0 && colPrev > 0) ? ((colTotal - colPrev) / colPrev * 100) : null;
                        return (
                          <td key={s.key} className={`py-2 px-3 text-right font-semibold ${labelColor}`}>
                            <div className="text-sm">{colTotal > 0 ? colTotal.toLocaleString() : "—"}</div>
                            {hasPrevYearTeamData && colYoy !== null && (
                              <div className={`text-[11px] font-medium ${colYoy >= 0 ? "text-green-400" : "text-red-400"}`}>
                                {colYoy >= 0 ? "▲" : "▼"}{Math.abs(colYoy).toFixed(0)}%
                              </div>
                            )}
                          </td>
                        );
                      })}
                      <td className={`py-2 px-3 text-right font-bold ${labelColor}`}>
                        <div className="text-sm">{regSvc > 0 ? regSvc.toLocaleString() : "—"}</div>
                        {hasPrevYearTeamData && regDkmYoy !== null && (
                          <div className={`text-[11px] font-medium mt-0.5 ${regDkmYoy >= 0 ? "text-green-400" : "text-red-400"}`}>
                            {regDkmYoy >= 0 ? "▲" : "▼"}{Math.abs(regDkmYoy).toFixed(1)}%
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right text-xs font-bold">
                        <span className={regRatio >= benchmark ? "text-green-400" : "text-red-400"}>
                          {regDs > 0 ? `${regRatio}%` : "—"}
                          <span className="ml-1 text-xs font-normal opacity-70">
                            {regDs > 0 ? (regRatio >= benchmark ? "✓" : `↓${benchmark - regRatio}%`) : ""}
                          </span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Phần 4: Báo Cáo Khách Hàng */}
        {(() => {
          const hasKhData = displayed.some(t => (t.customerCount ?? 0) > 0);
          const hasPrevKhData = prevYearTeams.some(t => (t.customerCount ?? 0) > 0);
          if (!hasKhData) return null;

          const rows = displayed.map(t => {
            const prev = prevYearTeamMap[t.teamId];
            const kh = t.customerCount ?? 0;
            const prevKh = prev?.customerCount ?? 0;
            const ds = t.revenue;
            const prevDs = prev?.revenue ?? 0;
            const avgDs = kh > 0 ? ds / kh : 0;
            const prevAvgDs = prevKh > 0 ? prevDs / prevKh : 0;
            const khYoy   = (kh > 0 && prevKh > 0)     ? ((kh - prevKh)         / prevKh   * 100) : null;
            const dsYoy   = (ds > 0 && prevDs > 0)     ? ((ds - prevDs)         / prevDs   * 100) : null;
            const avgYoy  = (avgDs > 0 && prevAvgDs > 0) ? ((avgDs - prevAvgDs) / prevAvgDs * 100) : null;
            return { ...t, kh, prevKh, ds, prevDs, avgDs, prevAvgDs, khYoy, dsYoy, avgYoy };
          });

          const regionSummary = (["HN","HCM","all"] as const).map(reg => {
            const ts = reg === "all" ? displayed : displayed.filter(t => t.region === reg);
            if (ts.length === 0) return null;
            const kh = ts.reduce((s,t) => s + (t.customerCount ?? 0), 0);
            const ds = ts.reduce((s,t) => s + t.revenue, 0);
            const avgDs = kh > 0 ? ds / kh : 0;
            const prevKh = ts.reduce((s,t) => s + (prevYearTeamMap[t.teamId]?.customerCount ?? 0), 0);
            const prevDs = ts.reduce((s,t) => s + (prevYearTeamMap[t.teamId]?.revenue ?? 0), 0);
            const prevAvgDs = prevKh > 0 ? prevDs / prevKh : 0;
            const khYoy  = (kh > 0 && prevKh > 0)       ? ((kh - prevKh)         / prevKh   * 100) : null;
            const dsYoy  = (ds > 0 && prevDs > 0)       ? ((ds - prevDs)         / prevDs   * 100) : null;
            const avgYoy = (avgDs > 0 && prevAvgDs > 0) ? ((avgDs - prevAvgDs)   / prevAvgDs * 100) : null;
            return { reg, kh, ds, avgDs, khYoy, dsYoy, avgYoy };
          }).filter(Boolean) as { reg: string; kh: number; ds: number; avgDs: number; khYoy: number|null; dsYoy: number|null; avgYoy: number|null; }[];

          function YoyBadge({ val }: { val: number | null }) {
            if (val === null) return null;
            return (
              <div className={`text-[11px] font-medium mt-0.5 ${val >= 0 ? "text-green-400" : "text-red-400"}`}>
                {val >= 0 ? "▲" : "▼"}{Math.abs(val).toFixed(1)}%
              </div>
            );
          }

          // Tính DS ĐKM per team (sum service keys) — dùng customerCountDkm riêng
          const dkmRows = rows.map(r => {
            const khDkm = (r as any).customerCountDkm ?? 0;
            const prevKhDkm = (prevYearTeamMap[r.teamId] as any)?.customerCountDkm ?? 0;
            const dkm = SVC_KEYS.reduce((s, sk) => s + ((r as any)[sk.key] ?? 0), 0);
            const prevDkm = SVC_KEYS.reduce((s, sk) => s + ((prevYearTeamMap[r.teamId] as any)?.[sk.key] ?? 0), 0);
            const avgDkm = khDkm > 0 ? dkm / khDkm : 0;
            const prevAvgDkm = prevKhDkm > 0 ? prevDkm / prevKhDkm : 0;
            const khDkmYoy  = (khDkm > 0 && prevKhDkm > 0)       ? ((khDkm - prevKhDkm)   / prevKhDkm  * 100) : null;
            const dkmYoy    = (dkm > 0 && prevDkm > 0)           ? ((dkm - prevDkm)       / prevDkm    * 100) : null;
            const avgDkmYoy = (avgDkm > 0 && prevAvgDkm > 0)     ? ((avgDkm - prevAvgDkm) / prevAvgDkm * 100) : null;
            const tlKhDkm   = (khDkm > 0 && r.kh > 0)           ? (khDkm / r.kh * 100)                       : null;
            const tlAvgDkm  = (avgDkm > 0 && r.avgDs > 0)        ? (avgDkm / r.avgDs * 100)                   : null;
            return { ...r, khDkm, prevKhDkm, dkm, prevDkm, avgDkm, prevAvgDkm, khDkmYoy, dkmYoy, avgDkmYoy, tlKhDkm, tlAvgDkm };
          });

          const hasDkmKhData = dkmRows.some(r => r.khDkm > 0);

          const dkmRegionSummary = (["HN","HCM","all"] as const).map(reg => {
            const ts = reg === "all" ? dkmRows : dkmRows.filter(t => t.region === reg);
            if (ts.length === 0) return null;
            const khDkm   = ts.reduce((s,t) => s + t.khDkm, 0);
            const khTotal = ts.reduce((s,t) => s + t.kh, 0);
            const dkm     = ts.reduce((s,t) => s + t.dkm, 0);
            const dsTotal = ts.reduce((s,t) => s + t.ds, 0);
            const prevKhDkm = ts.reduce((s,t) => s + t.prevKhDkm, 0);
            const prevDkm   = ts.reduce((s,t) => s + t.prevDkm, 0);
            const avgDkm      = khDkm > 0   ? dkm / khDkm     : 0;
            const avgDsTotal  = khTotal > 0  ? dsTotal / khTotal : 0;
            const prevAvgDkm  = prevKhDkm > 0 ? prevDkm / prevKhDkm : 0;
            const khDkmYoy  = (khDkm > 0 && prevKhDkm > 0)       ? ((khDkm - prevKhDkm)   / prevKhDkm  * 100) : null;
            const dkmYoy    = (dkm > 0 && prevDkm > 0)           ? ((dkm - prevDkm)       / prevDkm    * 100) : null;
            const avgDkmYoy = (avgDkm > 0 && prevAvgDkm > 0)     ? ((avgDkm - prevAvgDkm) / prevAvgDkm * 100) : null;
            const tlKhDkm   = (khDkm > 0 && khTotal > 0)         ? (khDkm / khTotal * 100)                    : null;
            const tlAvgDkm  = (avgDkm > 0 && avgDsTotal > 0)     ? (avgDkm / avgDsTotal * 100)                : null;
            return { reg, khDkm, dkm, avgDkm, khDkmYoy, dkmYoy, avgDkmYoy, tlKhDkm, tlAvgDkm };
          }).filter(Boolean) as { reg: string; khDkm: number; dkm: number; avgDkm: number; khDkmYoy: number|null; dkmYoy: number|null; avgDkmYoy: number|null; tlKhDkm: number|null; tlAvgDkm: number|null; }[];

          return (
            <>
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Báo Cáo Khách Hàng — {filterLabel}</CardTitle>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span>Tổng Số KH · DS (triệu VNĐ) · TB DS/KH</span>
                  {hasPrevKhData && <span className="text-amber-400">▲/▼ so cùng kỳ 2025</span>}
                </div>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-2 px-3 text-slate-400 w-32">Team</th>
                      <th className="text-center py-2 px-2 text-slate-400">Vùng</th>
                      <th className="text-right py-2 px-3 text-teal-400 font-medium">Số KH</th>
                      <th className="text-right py-2 px-3 text-blue-400 font-medium">DS (tr.đ)</th>
                      <th className="text-right py-2 px-3 text-purple-400 font-medium">TB DS/KH</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(r => (
                      <tr key={r.teamId} className="border-b border-slate-800 hover:bg-slate-800/30">
                        <td className="py-2 px-3 text-white font-medium">{r.teamName}</td>
                        <td className="py-2 px-2 text-center">
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${r.region === "HN" ? "bg-blue-500/20 text-blue-400" : "bg-orange-500/20 text-orange-400"}`}>
                            {r.region}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <div className="text-sm font-semibold text-teal-300">{r.kh > 0 ? r.kh : "—"}</div>
                          {hasPrevKhData && <YoyBadge val={r.khYoy} />}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <div className="text-sm font-semibold text-blue-300">{r.ds > 0 ? r.ds.toLocaleString() : "—"}</div>
                          {hasPrevKhData && <YoyBadge val={r.dsYoy} />}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <div className="text-sm font-semibold text-purple-300">{r.avgDs > 0 ? r.avgDs.toFixed(1) : "—"}</div>
                          {hasPrevKhData && <YoyBadge val={r.avgYoy} />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    {regionSummary.map(s => {
                      const isTotal = s.reg === "all";
                      const labelColor = s.reg === "HN" ? "text-blue-300" : s.reg === "HCM" ? "text-orange-300" : "text-white";
                      const rowBg = s.reg === "HN" ? "bg-blue-900/20 border-blue-500/30" : s.reg === "HCM" ? "bg-orange-900/20 border-orange-500/30" : "bg-slate-800/50 border-slate-600";
                      return (
                        <tr key={s.reg} className={`border-t-2 ${rowBg}`}>
                          <td className={`py-2 px-3 font-bold text-xs ${labelColor}`} colSpan={2}>
                            {isTotal ? "TỔNG" : `Khu vực ${s.reg}`}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <div className={`text-sm font-bold ${labelColor}`}>{s.kh > 0 ? s.kh : "—"}</div>
                            {hasPrevKhData && <YoyBadge val={s.khYoy} />}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <div className={`text-sm font-bold ${labelColor}`}>{s.ds > 0 ? s.ds.toLocaleString() : "—"}</div>
                            {hasPrevKhData && <YoyBadge val={s.dsYoy} />}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <div className={`text-sm font-bold ${labelColor}`}>{s.avgDs > 0 ? s.avgDs.toFixed(1) : "—"}</div>
                            {hasPrevKhData && <YoyBadge val={s.avgYoy} />}
                          </td>
                        </tr>
                      );
                    })}
                  </tfoot>
                </table>
              </CardContent>
            </Card>

            {/* Bảng TB DS ĐKM / KH — chỉ hiện khi có dữ liệu KH ĐKM */}
            {hasDkmKhData && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>TB Doanh Số Đăng Ký Mới / Khách Hàng — {filterLabel}</CardTitle>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span>KH ĐKM · DS ĐKM (triệu VNĐ) · TB DS ĐKM/KH</span>
                  {hasPrevKhData && <span className="text-amber-400">▲/▼ so cùng kỳ 2025</span>}
                </div>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-2 px-3 text-slate-400 w-32">Team</th>
                      <th className="text-center py-2 px-2 text-slate-400">Vùng</th>
                      <th className="text-right py-2 px-3 text-cyan-400 font-medium">KH ĐKM</th>
                      <th className="text-right py-2 px-3 text-blue-400 font-medium">DS ĐKM (tr.đ)</th>
                      <th className="text-right py-2 px-3 text-purple-400 font-medium">TB DS ĐKM/KH</th>
                      <th className="text-right py-2 px-3 text-amber-400 font-medium">KH ĐKM / Tổng KH</th>
                      <th className="text-right py-2 px-3 text-rose-400 font-medium">TB DS ĐKM/KH / TB DS/KH</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dkmRows.map(r => (
                      <tr key={r.teamId} className="border-b border-slate-800 hover:bg-slate-800/30">
                        <td className="py-2 px-3 text-white font-medium">{r.teamName}</td>
                        <td className="py-2 px-2 text-center">
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${r.region === "HN" ? "bg-blue-500/20 text-blue-400" : "bg-orange-500/20 text-orange-400"}`}>
                            {r.region}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <div className="text-sm font-semibold text-cyan-300">{r.khDkm > 0 ? r.khDkm : "—"}</div>
                          {hasPrevKhData && <YoyBadge val={r.khDkmYoy} />}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <div className="text-sm font-semibold text-blue-300">{r.dkm > 0 ? r.dkm.toLocaleString() : "—"}</div>
                          {hasPrevKhData && <YoyBadge val={r.dkmYoy} />}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <div className="text-sm font-semibold text-purple-300">{r.avgDkm > 0 ? r.avgDkm.toFixed(1) : "—"}</div>
                          {hasPrevKhData && <YoyBadge val={r.avgDkmYoy} />}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <div className="text-sm font-semibold text-amber-300">{r.tlKhDkm != null ? `${r.tlKhDkm.toFixed(1)}%` : "—"}</div>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <div className="text-sm font-semibold text-rose-300">{r.tlAvgDkm != null ? `${r.tlAvgDkm.toFixed(1)}%` : "—"}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    {dkmRegionSummary.map(s => {
                      const isTotal = s.reg === "all";
                      const labelColor = s.reg === "HN" ? "text-blue-300" : s.reg === "HCM" ? "text-orange-300" : "text-white";
                      const rowBg = s.reg === "HN" ? "bg-blue-900/20 border-blue-500/30" : s.reg === "HCM" ? "bg-orange-900/20 border-orange-500/30" : "bg-slate-800/50 border-slate-600";
                      return (
                        <tr key={s.reg} className={`border-t-2 ${rowBg}`}>
                          <td className={`py-2 px-3 font-bold text-xs ${labelColor}`} colSpan={2}>
                            {isTotal ? "TỔNG" : `Khu vực ${s.reg}`}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <div className={`text-sm font-bold ${labelColor}`}>{s.khDkm > 0 ? s.khDkm : "—"}</div>
                            {hasPrevKhData && <YoyBadge val={s.khDkmYoy} />}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <div className={`text-sm font-bold ${labelColor}`}>{s.dkm > 0 ? s.dkm.toLocaleString() : "—"}</div>
                            {hasPrevKhData && <YoyBadge val={s.dkmYoy} />}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <div className={`text-sm font-bold ${labelColor}`}>{s.avgDkm > 0 ? s.avgDkm.toFixed(1) : "—"}</div>
                            {hasPrevKhData && <YoyBadge val={s.avgDkmYoy} />}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <div className={`text-sm font-bold text-amber-300`}>{s.tlKhDkm != null ? `${s.tlKhDkm.toFixed(1)}%` : "—"}</div>
                          </td>
                          <td className="py-2 px-3 text-right">
                            <div className={`text-sm font-bold text-rose-300`}>{s.tlAvgDkm != null ? `${s.tlAvgDkm.toFixed(1)}%` : "—"}</div>
                          </td>
                        </tr>
                      );
                    })}
                  </tfoot>
                </table>
              </CardContent>
            </Card>
            )}
            </>
          );
        })()}

        {/* Phần 5: So sánh dịch vụ giữa các team */}
        <Card>
          <CardHeader>
            <CardTitle>So Sánh Doanh Số Đăng Ký Mới Các Team</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={serviceCompareData} margin={{ bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="service" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} tickFormatter={v => `${v}M`} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v: any) => [`${Number(v).toLocaleString()}M`]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {displayedSorted.map((t, i) => (
                  <Bar key={t.teamId} dataKey={t.teamName} fill={TEAM_COLORS[i % TEAM_COLORS.length]} radius={[3,3,0,0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {showHistory && <AiHistoryPanel onClose={() => setShowHistory(false)} />}
      {showAI && (
        <AiAnalysisPanel context="teams" data={{
          period: filterLabel,
          teams: allTeams,
          totalRev: allTeams.reduce((s, t) => s + t.revenue, 0),
          totalTarget: allTeams.reduce((s, t) => s + t.target, 0),
          hnRev: hnTeams.reduce((s, t) => s + t.revenue, 0),
          hcmRev: hcmTeams.reduce((s, t) => s + t.revenue, 0),
          prevRev: prevTeams.reduce((s, t) => s + t.revenue, 0),
          prevLabel,
          prevYearRev,
        }} onClose={() => setShowAI(false)} />
      )}
    </div>
  );
}
