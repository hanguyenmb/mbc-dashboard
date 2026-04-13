"use client";

import { useState, useEffect, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Legend, LabelList, ReferenceLine,
  ComposedChart, Line,
} from "recharts";
import { Header, PageHeader } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Sparkles, History, TrendingUp, TrendingDown, MapPin } from "lucide-react";
import { AiAnalysisPanel } from "@/components/ai/ai-analysis-panel";
import { AiHistoryPanel } from "@/components/ai/ai-history-panel";
import { MiniAiPanel } from "@/components/ai/mini-ai-panel";
import { TEAM_SERVICE_DATA } from "@/lib/mock-data";
import type { UserRole, TeamMonthlyData, TeamServiceRecord, ServiceConfig } from "@/lib/types";
import { DEFAULT_SERVICE_CONFIG } from "@/lib/types";

interface MonthlyRow { month: string; cumKy: number; hn: number | null; hcm: number | null; hnPrev?: number | null; hcmPrev?: number | null; [k: string]: any; }

interface TeamsClientProps {
  role: UserRole;
  teamId: string | null;
  teamServiceData: TeamMonthlyData;
  teamPrevData: TeamMonthlyData;
  monthlyData: MonthlyRow[];
  serviceConfig?: ServiceConfig[];
}

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

export function TeamsClient({ role, teamId, teamServiceData, teamPrevData, monthlyData, serviceConfig }: TeamsClientProps) {
  const SVC_KEYS: ServiceConfig[] = serviceConfig?.length ? serviceConfig : DEFAULT_SERVICE_CONFIG;
  // Elastic không cộng vào tổng ĐKM (đã có trong Cloud Server, để riêng theo dõi)
  const DKM_SVC_KEYS = SVC_KEYS.filter(s => s.key !== 'elastic');
  const [showAI, setShowAI] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [region, setRegion] = useState<"all" | "HN" | "HCM">("all");
  const [view, setView] = useState<"month" | "quarter">("month");
  const [selectedMonth, setSelectedMonth] = useState(`T${new Date().getMonth() + 1}`);
  const [selectedQuarter, setSelectedQuarter] = useState(1);
  const [openDropdown, setOpenDropdown] = useState<"month" | "quarter" | null>(null);
  const [benchmark, setBenchmark] = useState(40);
  const [trendTeamId, setTrendTeamId] = useState<string | null>(null);
  const [radarTeamId, setRadarTeamId] = useState<string | null>(null);
  const [expandedCeoTeam, setExpandedCeoTeam] = useState<string | null>(null);
  const [svcNotes, setSvcNotes] = useState<Record<string, string>>({});
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("trend_svc_notes");
      if (saved) setSvcNotes(JSON.parse(saved));
    } catch {}
  }, []);

  function saveNote(key: string, text: string) {
    const updated = { ...svcNotes, [key]: text.trim() };
    if (!text.trim()) delete updated[key];
    setSvcNotes(updated);
    try { localStorage.setItem("trend_svc_notes", JSON.stringify(updated)); } catch {}
    setEditingNote(null);
  }

  const [teamNotes, setTeamNotes] = useState<Record<string, string>>({});
  const [editingTeamNote, setEditingTeamNote] = useState<string | null>(null);
  const [teamNoteInput, setTeamNoteInput] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ceo_team_notes");
      if (saved) setTeamNotes(JSON.parse(saved));
    } catch {}
  }, []);

  function saveTeamNote(id: string, text: string) {
    const updated = { ...teamNotes, [id]: text.trim() };
    if (!text.trim()) delete updated[id];
    setTeamNotes(updated);
    try { localStorage.setItem("ceo_team_notes", JSON.stringify(updated)); } catch {}
    setEditingTeamNote(null);
  }
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
          map[t.teamId] = { ...t, revenue: 0, target: 0, customerCount: 0, hostMail: 0, msgws: 0, tenMien: 0, transferGws: 0, saleAi: 0, elastic: 0, cloudServer: 0 };
        }
        map[t.teamId].revenue        += t.revenue;
        map[t.teamId].target         += t.target;
        map[t.teamId].customerCount  += (t.customerCount ?? 0);
        map[t.teamId].hostMail       += t.hostMail;
        map[t.teamId].msgws          += t.msgws;
        map[t.teamId].tenMien        += t.tenMien;
        map[t.teamId].transferGws    += t.transferGws;
        map[t.teamId].saleAi         += t.saleAi;
        map[t.teamId].elastic        += t.elastic;
        map[t.teamId].cloudServer    += (t.cloudServer ?? 0);
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

  // ── Pace calculation (tháng hiện tại chưa kết thúc) ──────────────────────────
  const _now = new Date();
  const _selMoNum = view === "month" ? parseInt(selectedMonth.replace("T","")) : null;
  const isCurrentPeriod = view === "month" && _selMoNum === _now.getMonth() + 1;
  const _daysInMonth  = isCurrentPeriod ? new Date(_now.getFullYear(), _selMoNum!, 0).getDate() : 30;
  const _daysElapsed  = isCurrentPeriod ? _now.getDate() : _daysInMonth;
  const globalPace    = isCurrentPeriod && _daysElapsed < _daysInMonth ? _daysElapsed / _daysInMonth : 1;
  const projRev       = (v: number) => globalPace < 1 ? Math.round(v / globalPace) : v;
  const paceBadgeLabel = isCurrentPeriod && globalPace < 1 ? `${_daysElapsed}/${_daysInMonth} ngày` : null;

  // Ranking chart data (pace-adjusted % vs target, pace-adjusted YoY)
  const rankingData = [...displayed]
    .sort((a, b) => b.revenue - a.revenue)
    .map(t => {
      const prev = prevYearTeamMap[t.teamId];
      const dsYoy = (t.revenue > 0 && prev && prev.revenue > 0)
        ? ((projRev(t.revenue) - prev.revenue) / prev.revenue * 100) : null;
      return {
        name: t.teamName,
        revenue: t.revenue,
        target: t.target,
        pct: pct(projRev(t.revenue), t.target),
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

  // Radar chart — HN vs HCM tổng hợp, hoặc 1 team vs toàn khu vực
  const radarSelectedTeam = radarTeamId ? displayed.find(t => t.teamId === radarTeamId) ?? null : null;
  const radarData = SVC_KEYS.map(s => {
    if (radarSelectedTeam) {
      // Mode: team vs khu vực của team đó
      const regionTeams = displayed.filter(t => t.region === radarSelectedTeam.region);
      const regionAvg = regionTeams.length > 0
        ? regionTeams.reduce((sum, t) => sum + ((t as any)[s.key] ?? 0), 0) / regionTeams.length
        : 0;
      return {
        subject: s.label,
        [radarSelectedTeam.teamName]: (radarSelectedTeam as any)[s.key] ?? 0,
        [`TB ${radarSelectedTeam.region}`]: regionAvg,
      };
    }
    return {
      subject: s.label,
      HN:  hnTeams.reduce((sum, t) => sum + ((t as any)[s.key] ?? 0), 0),
      HCM: hcmTeams.reduce((sum, t) => sum + ((t as any)[s.key] ?? 0), 0),
    };
  });

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
          const projTotal   = projRev(totalRev);
          const totalPct    = pct(projTotal, totalTarget);
          const prevRev     = prevTeams.reduce((s, t) => s + t.revenue, 0);
          const momDiff     = prevRev > 0 ? ((projTotal - prevRev) / prevRev * 100) : null;
          const yoyDiff     = prevYearRev != null && prevYearRev > 0 ? ((projTotal - prevYearRev) / prevYearRev * 100) : null;
          const hnRev       = hnTeams.reduce((s, t) => s + t.revenue, 0);
          const hcmRev      = hcmTeams.reduce((s, t) => s + t.revenue, 0);
          const hnShare     = totalRev > 0 ? Math.round((hnRev / totalRev) * 100) : 0;
          const hcmShare    = totalRev > 0 ? Math.round((hcmRev / totalRev) * 100) : 0;
          const hnTarget    = hnTeams.reduce((s,t) => s + t.target, 0);
          const hcmTarget   = hcmTeams.reduce((s,t) => s + t.target, 0);
          const projHn      = projRev(hnRev);
          const projHcm     = projRev(hcmRev);
          const prevHnRev   = prevTeams.filter(t => t.region === "HN").reduce((s, t) => s + t.revenue, 0);
          const prevHcmRev  = prevTeams.filter(t => t.region === "HCM").reduce((s, t) => s + t.revenue, 0);
          const hnMom       = prevHnRev > 0 ? ((projHn - prevHnRev) / prevHnRev * 100) : null;
          const hcmMom      = prevHcmRev > 0 ? ((projHcm - prevHcmRev) / prevHcmRev * 100) : null;
          const hnYoy       = prevYearHnRev != null && prevYearHnRev > 0 ? ((projHn - prevYearHnRev) / prevYearHnRev * 100) : null;
          const hcmYoy      = prevYearHcmRev != null && prevYearHcmRev > 0 ? ((projHcm - prevYearHcmRev) / prevYearHcmRev * 100) : null;
          return (
            <div className="rounded-xl border border-slate-600/50 bg-slate-800/40 p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">
                      Tổng Doanh Số Toàn Quốc — {view === "month" ? selectedMonth : `Q${selectedQuarter}`}
                    </span>
                    {paceBadgeLabel && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300">
                        ⏱ {paceBadgeLabel} — hiển thị theo tốc độ dự kiến
                      </span>
                    )}
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
                  <div className="flex items-baseline gap-2">
                    <div className="text-4xl font-bold text-white">{totalRev.toLocaleString()}<span className="text-xl text-slate-400 ml-1">M</span></div>
                    {paceBadgeLabel && (
                      <div className="text-sm text-amber-300/80">→ dự kiến ~{projTotal.toLocaleString()}M</div>
                    )}
                  </div>
                  <div className="text-sm text-slate-400 mt-1 flex flex-wrap gap-x-4 gap-y-0.5">
                    <span>Mục tiêu: <span className="text-white font-medium">{totalTarget.toLocaleString()}M</span></span>
                    {prevRev > 0 && prevLabel && (
                      <span>Kỳ trước ({prevLabel}): <span className="text-slate-300">{prevRev.toLocaleString()}M</span></span>
                    )}
                    {prevYearRev != null && prevYearRev > 0 && (
                      <span>Cùng kỳ 2025: <span className="text-slate-300">{(prevYearRev).toLocaleString()}M</span></span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-bold ${thresholdColor(totalPct)}`}>{totalPct}%</div>
                  <div className="text-xs text-slate-400 mt-1">{paceBadgeLabel ? "Dự kiến đạt MT" : "Đạt mục tiêu"}</div>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    {totalPct >= 100
                      ? <TrendingUp size={14} className="text-green-400" />
                      : <TrendingDown size={14} className="text-red-400" />}
                    <span className={`text-xs font-semibold ${thresholdColor(totalPct)}`}>
                      {totalPct >= 100 ? "Đạt chỉ tiêu" : `Còn thiếu ${(totalTarget - projTotal).toLocaleString()}M`}
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
                    <span className="text-xs text-slate-400">{hnTeams.length} team · MT: {hnTarget.toLocaleString()}M</span>
                    <span className={`text-xs font-bold ${thresholdColor(pct(projHn, hnTarget))}`}>
                      Đạt {pct(projHn, hnTarget)}% MT
                    </span>
                  </div>
                  <div className="mt-1.5 h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(pct(projHn, hnTarget), 100)}%` }} />
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
                    <span className="text-xs text-slate-400">{hcmTeams.length} team · MT: {hcmTarget.toLocaleString()}M</span>
                    <span className={`text-xs font-bold ${thresholdColor(pct(projHcm, hcmTarget))}`}>
                      Đạt {pct(projHcm, hcmTarget)}% MT
                    </span>
                  </div>
                  <div className="mt-1.5 h-1 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: `${Math.min(pct(projHcm, hcmTarget), 100)}%` }} />
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

        {/* Phần 4a: Phân Tích Vị Thế Team — Góc Nhìn CEO */}
        {hasPrevYearTeamData && (() => {
          const now         = new Date();
          const selMonthNum = parseInt(selectedMonth.replace("T", ""));
          const isCurrentMo = view === "month" && selMonthNum === now.getMonth() + 1;
          const daysInMonth = new Date(now.getFullYear(), selMonthNum, 0).getDate();
          const daysElapsed = isCurrentMo ? now.getDate() : daysInMonth;
          const paceRatio   = Math.min(daysElapsed / daysInMonth, 1);
          const isProjected = isCurrentMo && paceRatio < 1;

          // Sparkline: last 4 months of total ĐKM for a team
          const MONTHS_SPARK = ["T1","T2","T3","T4","T5","T6","T7","T8","T9","T10","T11","T12"];
          const curMkIdx = MONTHS_SPARK.indexOf(selectedMonth);
          const sparkKeys = MONTHS_SPARK.slice(Math.max(0, curMkIdx - 3), curMkIdx + 1);

          function teamSparkVals(teamId: string): number[] {
            return sparkKeys.map(mk => {
              const t = allMonths.find(m => m.month === mk)?.teams.find(t => t.teamId === teamId);
              return t ? DKM_SVC_KEYS.reduce((s, sk) => s + ((t as any)[sk.key] ?? 0), 0) : 0;
            });
          }

          // ── Tính ratio ĐKM/DS cùng kỳ theo region, loại trừ Reseller ────────────
          const isReseller = (name: string) => name.toLowerCase().includes("reseller");

          // Dùng prevYearTeams (cùng tháng/quý cùng kỳ 2025)
          const prevHnNormal  = prevYearTeams.filter(t => t.region === "HN"  && !isReseller(t.teamName));
          const prevHcmNormal = prevYearTeams.filter(t => t.region === "HCM" && !isReseller(t.teamName));

          const sumDkm = (arr: typeof prevYearTeams) =>
            arr.reduce((s, t) => s + DKM_SVC_KEYS.reduce((ss, sk) => ss + ((t as any)[sk.key] ?? 0), 0), 0);
          const sumRev = (arr: typeof prevYearTeams) =>
            arr.reduce((s, t) => s + t.revenue, 0);

          const hnPrevDkmTotal  = sumDkm(prevHnNormal);
          const hnPrevRevTotal  = sumRev(prevHnNormal);
          const hcmPrevDkmTotal = sumDkm(prevHcmNormal);
          const hcmPrevRevTotal = sumRev(prevHcmNormal);

          // ratio × 1.1 (năm nay tập trung ĐKM hơn), cap tại 0.95 để tránh bất thường
          const ratioHN  = hnPrevRevTotal  > 0 ? Math.min((hnPrevDkmTotal  / hnPrevRevTotal)  * 1.1, 0.95) : null;
          const ratioHCM = hcmPrevRevTotal > 0 ? Math.min((hcmPrevDkmTotal / hcmPrevRevTotal) * 1.1, 0.95) : null;

          const teamData = displayed.map(t => {
            const rawDkm  = DKM_SVC_KEYS.reduce((s, sk) => s + ((t as any)[sk.key] ?? 0), 0);
            const projDkm = isProjected ? rawDkm / paceRatio : rawDkm;
            const projRev = isProjected ? t.revenue / paceRatio : t.revenue;
            const prev    = prevYearTeamMap[t.teamId];
            const prevDkm = prev ? DKM_SVC_KEYS.reduce((s, sk) => s + ((prev as any)[sk.key] ?? 0), 0) : 0;
            const yoy     = prevDkm > 0 ? ((projDkm - prevDkm) / prevDkm * 100) : null;
            const sparkVals = teamSparkVals(t.teamId);
            const confidence: "Cao" | "Trung bình" | "Thấp" =
              paceRatio >= 0.5 ? "Cao" : paceRatio >= 0.3 ? "Trung bình" : "Thấp";

            // ── Tính mục tiêu ĐKM ước tính ──────────────────────────────────
            let dkmTarget: number | null = null;
            let dkmTargetRatio: number | null = null;
            let dkmTargetNote = "";
            if (t.target > 0) {
              if (isReseller(t.teamName)) {
                // Reseller: dùng ratio của chính team năm ngoái, không nhân 1.1
                const prevRevTeam = prev?.revenue ?? 0;
                if (prevRevTeam > 0 && prevDkm > 0) {
                  dkmTargetRatio = prevDkm / prevRevTeam;
                  dkmTarget = dkmTargetRatio * t.target;
                  dkmTargetNote = `Reseller · tỉ lệ CK25: ${(dkmTargetRatio * 100).toFixed(0)}%`;
                }
              } else {
                const ratio = t.region === "HN" ? ratioHN : ratioHCM;
                if (ratio !== null) {
                  dkmTargetRatio = ratio;
                  dkmTarget = ratio * t.target;
                  dkmTargetNote = `Tỉ lệ ${t.region} CK25×1.1: ${(ratio * 100).toFixed(0)}%`;
                }
              }
            }

            // % đạt mục tiêu ĐKM (dùng projDkm so với dkmTarget)
            // So rawDkm vs kỳ vọng tại thời điểm hiện tại (dkmTarget × pace)
            // → team đang đúng tốc độ = 100%, nhanh hơn > 100%, chậm hơn < 100%
            const dkmKpiPct = dkmTarget && dkmTarget > 0
              ? Math.round(rawDkm / (dkmTarget * paceRatio) * 100)
              : null;
            // % đạt mục tiêu DS tổng (dùng projRev so với target)
            const kpiPct = t.target > 0 ? Math.round(projRev / t.target * 100) : null;

            // 3-month trend: completed months only (exclude current if mid-month)
            const completedSpark = isProjected ? sparkVals.slice(0, -1) : sparkVals;
            const last3 = completedSpark.filter(v => v > 0).slice(-3);
            let momTrend: number | null = null;
            if (last3.length >= 2) {
              const oldAvg = last3.slice(0, -1).reduce((s, v) => s + v, 0) / (last3.length - 1);
              const newVal = last3[last3.length - 1];
              momTrend = oldAvg > 0 ? (newVal - oldAvg) / oldAvg * 100 : null;
            }

            return {
              id: t.teamId, name: t.teamName, region: t.region,
              rawDkm, projDkm, rawRev: t.revenue, projRev, target: t.target,
              prevDkm, yoy, hasYoy: prevDkm > 0,
              kpiPct, dkmKpiPct, dkmTarget, dkmTargetNote,
              sparkVals, confidence, momTrend,
            };
          }).filter(t => t.rawDkm > 0 || t.rawRev > 0);

          if (teamData.length < 2) return null;

          const totalRaw   = teamData.reduce((s, t) => s + t.rawDkm, 0);
          const totalProj  = teamData.reduce((s, t) => s + t.projDkm, 0);

          // Xếp ô: trục 1 = YoY ĐKM, trục 2 = % đạt mục tiêu ĐKM ước tính (≥80% = đạt)
          const DKM_KPI_THRESHOLD = 80;
          const inGoodDkm = (t: typeof teamData[0]) => t.dkmKpiPct !== null ? t.dkmKpiPct >= DKM_KPI_THRESHOLD : t.projDkm >= totalProj / teamData.length;
          const inGoodYoy = (t: typeof teamData[0]) => (t.yoy ?? 0) >= 0;

          const starCount  = teamData.filter(t => inGoodYoy(t) && inGoodDkm(t)).length;
          const watchCount = teamData.filter(t => !inGoodYoy(t) || !inGoodDkm(t)).length;

          // Tổng mục tiêu ĐKM ước tính (chỉ tính team có dkmTarget)
          const totalDkmTarget = teamData.reduce((s, t) => s + (t.dkmTarget ?? 0), 0);
          const totalDkmKpiPct = totalDkmTarget > 0 ? Math.round(totalProj / totalDkmTarget * 100) : null;

          // Breakdown HN / HCM
          const mkRegionSummary = (reg: "HN" | "HCM") => {
            const ts = teamData.filter(t => t.region === reg);
            const raw    = ts.reduce((s, t) => s + t.rawDkm, 0);
            const proj   = ts.reduce((s, t) => s + t.projDkm, 0);
            const target = ts.reduce((s, t) => s + (t.dkmTarget ?? 0), 0);
            // Dùng pace-adjusted: raw vs (target × pace)
            const pct    = target > 0 ? Math.round(raw / (target * paceRatio) * 100) : null;
            const prevTotal = ts.reduce((s, t) => s + t.prevDkm, 0);
            const yoy    = prevTotal > 0 ? Math.round((proj - prevTotal) / prevTotal * 100) : null;
            return { reg, raw, proj, target, pct, yoy };
          };
          const hnSummary  = mkRegionSummary("HN");
          const hcmSummary = mkRegionSummary("HCM");

          // Sort: tích cực → % đạt ĐKM cao nhất; tiêu cực → YoY âm nhất lên trước
          const sortDesc  = (a: typeof teamData[0], b: typeof teamData[0]) => (b.dkmKpiPct ?? b.projDkm) - (a.dkmKpiPct ?? a.projDkm);
          const sortWorst = (a: typeof teamData[0], b: typeof teamData[0]) => (a.yoy ?? 0) - (b.yoy ?? 0);

          const quadGroups = [
            { key: "star",      label: "⭐ Ngôi Sao",  sub: "YoY tốt · đang đạt KPI ĐKM",        borderCls: "border-green-600/40",  headCls: "text-green-400",  bgCls: "bg-green-500/5",  teams: teamData.filter(t =>  inGoodYoy(t) &&  inGoodDkm(t)).sort(sortDesc)  },
            { key: "potential", label: "🔄 Ổn Định",   sub: "YoY tốt · KPI ĐKM cần cải thiện",   borderCls: "border-violet-600/40", headCls: "text-violet-400", bgCls: "bg-violet-500/5", teams: teamData.filter(t =>  inGoodYoy(t) && !inGoodDkm(t)).sort(sortDesc)  },
            { key: "stable",    label: "⚠️ Chú Ý",    sub: "KPI ĐKM ổn · nhưng YoY đang giảm",  borderCls: "border-amber-600/40",  headCls: "text-amber-400",  bgCls: "bg-amber-500/5",  teams: teamData.filter(t => !inGoodYoy(t) &&  inGoodDkm(t)).sort(sortWorst) },
            { key: "watch",     label: "🚨 Khẩn Cấp", sub: "YoY giảm · KPI ĐKM chưa đạt",       borderCls: "border-red-600/40",    headCls: "text-red-400",    bgCls: "bg-red-500/5",    teams: teamData.filter(t => !inGoodYoy(t) && !inGoodDkm(t)).sort(sortWorst) },
          ];

          function MiniSparkline({ vals }: { vals: number[] }) {
            const max = Math.max(...vals, 1);
            return (
              <div className="flex items-end gap-[2px] h-[14px]">
                {vals.map((v, i) => (
                  <div key={i} className="w-[4px] rounded-sm"
                    style={{ height: `${Math.max(2, Math.round((v / max) * 14))}px`,
                             backgroundColor: i === vals.length - 1 ? "#60a5fa" : "#475569" }} />
                ))}
              </div>
            );
          }

          function KpiBar({ pct, projected }: { pct: number | null; projected?: boolean }) {
            if (pct === null) return null;
            const capped = Math.min(pct, 100);
            const color = pct >= 90 ? "#22c55e" : pct >= 70 ? "#f59e0b" : "#ef4444";
            return (
              <div>
                <div className="flex justify-between items-center mb-0.5">
                  <span className="text-[10px] text-slate-500">{projected ? "KPI dự kiến cuối tháng" : "KPI tháng"}</span>
                  <span className="text-[11px] font-semibold font-mono" style={{ color }}>{pct}%</span>
                </div>
                <div className="h-[3px] bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${capped}%`, backgroundColor: color }} />
                </div>
              </div>
            );
          }

          return (
            <Card>
              <CardContent className="pt-5 space-y-4">
                {/* Header */}
                <div className="relative pr-32">
                  <h2 className="text-sm font-bold text-white">Phân Tích Vị Thế Team — Góc Nhìn CEO</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Mục tiêu ĐKM ước tính = tỉ lệ ĐKM/DS cùng kỳ 2025 × 1.1 × mục tiêu DS tháng
                    <span className="text-slate-500 mx-1.5">·</span>
                    {ratioHN !== null && <span className="text-slate-300">HN {(ratioHN * 100).toFixed(0)}%</span>}
                    {ratioHN !== null && ratioHCM !== null && <span className="text-slate-600 mx-1">·</span>}
                    {ratioHCM !== null && <span className="text-slate-300">HCM {(ratioHCM * 100).toFixed(0)}%</span>}
                    <span className="text-slate-500 mx-1.5">·</span>
                    Dữ liệu {filterLabel}/2026
                  </p>
                  {isProjected && (
                    <p className="text-[11px] text-amber-400/90 mt-0.5">
                      ⚠ Tháng chưa kết thúc ({daysElapsed}/{daysInMonth} ngày) — Dự kiến = tốc độ thực tế × {daysInMonth}/{daysElapsed} · Giả định tuyến tính · Sai số ±15%
                    </p>
                  )}
                  <div className="absolute top-0 right-0">
                    <MiniAiPanel context="ceo_quadrant" label="AI nhận xét" data={{ period: filterLabel, region, paceRatio, teams: teamData.map(t => ({ name: t.name, region: t.region, rawDkm: t.rawDkm, projDkm: t.projDkm, yoy: t.yoy, kpiPct: t.kpiPct })) }} />
                  </div>
                </div>

                {/* Summary strip — row 1: tổng */}
                <div className="grid grid-cols-4 gap-2">
                  {/* ĐKM Thực tế */}
                  <div className="rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 py-2.5">
                    <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wide mb-1">ĐKM Thực tế</div>
                    <div className="text-xl font-bold leading-none text-blue-400">{Math.round(totalRaw).toLocaleString()}M</div>
                    <div className="text-[11px] text-slate-400 mt-1">{daysElapsed} ngày đầu tháng</div>
                  </div>
                  {/* ĐKM Dự kiến + % mục tiêu */}
                  <div className="rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 py-2.5">
                    <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wide mb-1">ĐKM Dự kiến</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold leading-none text-white">{isProjected ? `${Math.round(totalProj).toLocaleString()}M` : `${Math.round(totalRaw).toLocaleString()}M`}</span>
                      {totalDkmKpiPct !== null && (
                        <span className={`text-sm font-bold font-mono ${totalDkmKpiPct >= 80 ? "text-green-400" : totalDkmKpiPct >= 60 ? "text-amber-400" : "text-red-400"}`}>
                          {totalDkmKpiPct}%
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {totalDkmTarget > 0 ? `/ ${Math.round(totalDkmTarget).toLocaleString()}M mục tiêu ĐKM` : "cuối tháng (ước tính)"}
                    </div>
                    {totalDkmTarget > 0 && (
                      <div className="mt-1.5 h-[3px] bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${Math.min(totalDkmKpiPct ?? 0, 100)}%`, backgroundColor: (totalDkmKpiPct ?? 0) >= 80 ? "#22c55e" : (totalDkmKpiPct ?? 0) >= 60 ? "#f59e0b" : "#ef4444" }} />
                      </div>
                    )}
                  </div>
                  {/* Ngôi Sao / Ổn Định */}
                  <div className="rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 py-2.5">
                    <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wide mb-1">Ngôi Sao / Ổn Định</div>
                    <div className="text-xl font-bold leading-none text-green-400">{starCount} team</div>
                    <div className="text-[11px] text-slate-400 mt-1">YoY tốt — đang tăng trưởng</div>
                  </div>
                  {/* Chú Ý / Khẩn Cấp */}
                  <div className="rounded-lg border border-slate-700/60 bg-slate-800/60 px-3 py-2.5">
                    <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wide mb-1">Chú Ý / Khẩn Cấp</div>
                    <div className="text-xl font-bold leading-none text-red-400">{watchCount} team</div>
                    <div className="text-[11px] text-slate-400 mt-1">YoY âm — cần can thiệp</div>
                  </div>
                </div>

                {/* Summary strip — row 2: HN vs HCM */}
                <div className="grid grid-cols-2 gap-2">
                  {[hnSummary, hcmSummary].map(s => {
                    const pctColor = (s.pct ?? 0) >= 80 ? "text-green-400" : (s.pct ?? 0) >= 60 ? "text-amber-400" : "text-red-400";
                    const barColor = (s.pct ?? 0) >= 80 ? "#22c55e" : (s.pct ?? 0) >= 60 ? "#f59e0b" : "#ef4444";
                    const regColor = s.reg === "HN" ? "text-blue-400 bg-blue-500/10 border-blue-500/30" : "text-orange-400 bg-orange-500/10 border-orange-500/30";
                    return (
                      <div key={s.reg} className={`rounded-lg border px-3 py-2.5 ${regColor}`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-mono uppercase tracking-wide font-bold">Khu vực {s.reg}</span>
                          {s.yoy !== null && (
                            <span className={`text-[11px] font-semibold font-mono ${s.yoy >= 0 ? "text-green-400" : "text-red-400"}`}>
                              {s.yoy >= 0 ? "▲" : "▼"}{Math.abs(s.yoy)}% YoY
                            </span>
                          )}
                        </div>
                        <div className="flex items-baseline gap-3">
                          <div>
                            <div className="text-[9px] text-slate-500 uppercase mb-0.5">Thực tế</div>
                            <div className="text-sm font-bold text-slate-200">{Math.round(s.raw).toLocaleString()}M</div>
                          </div>
                          <div>
                            <div className="text-[9px] text-slate-500 uppercase mb-0.5">Dự kiến</div>
                            <div className="text-sm font-bold text-white">{Math.round(s.proj).toLocaleString()}M</div>
                          </div>
                          {s.target > 0 && (
                            <div className="flex-1">
                              <div className="flex justify-between items-center mb-0.5">
                                <span className="text-[9px] text-slate-500 uppercase">Mục tiêu ĐKM</span>
                                <span className={`text-[11px] font-bold font-mono ${pctColor}`}>{s.pct ?? "—"}%</span>
                              </div>
                              <div className="h-[3px] bg-slate-700/60 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${Math.min(s.pct ?? 0, 100)}%`, backgroundColor: barColor }} />
                              </div>
                              <div className="text-[9px] text-slate-500 mt-0.5">/ {Math.round(s.target).toLocaleString()}M</div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Legend strip */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 rounded-lg border border-slate-700/50 bg-slate-800/40 text-[11px] text-slate-400">
                  <span>Tốc độ ĐKM:</span>
                  <span><span className="text-green-400 font-bold">■</span> ≥80% đúng tiến độ</span>
                  <span><span className="text-amber-400 font-bold">■</span> 60–79% hơi chậm</span>
                  <span><span className="text-red-400 font-bold">■</span> &lt;60% chậm đáng kể</span>
                  <span className="text-slate-500">·</span>
                  <span>Xếp ô: YoY ĐKM × tốc độ vs kỳ vọng (ngưỡng 80%) · <span className="text-amber-300 font-mono">≈</span> = vùng 75–84% (gần ngưỡng)</span>
                  <span className="text-slate-500">·</span>
                  <span><span className="text-green-400 font-mono font-bold">↑ 3T</span> / <span className="text-slate-400 font-mono font-bold">→ 3T</span> / <span className="text-red-400 font-mono font-bold">↓ 3T</span> = xu hướng DS ĐKM 3 tháng thực tế gần nhất</span>
                  <span className="text-slate-500">·</span>
                  <span className="px-1.5 py-0.5 rounded border border-amber-600/40 text-amber-400 text-[10px] font-mono">BASE↓</span>
                  <span>= YoY cao do cùng kỳ 2025 bất thường thấp</span>
                </div>

                {/* Quad grid */}
                <div className="grid grid-cols-2 gap-3">
                  {quadGroups.map(q => (
                    <div key={q.key} className={`rounded-xl border p-4 ${q.borderCls} ${q.bgCls}`}>
                      <div className="flex items-center justify-between mb-0.5 gap-2">
                        <div className={`text-sm font-bold whitespace-nowrap ${q.headCls}`}>{q.label}</div>
                        <MiniAiPanel
                          context="ceo_quadrant_action"
                          label="Gợi ý"
                          data={{
                            period: filterLabel,
                            quadLabel: q.label,
                            quadKey: q.key,
                            paceRatio,
                            daysElapsed,
                            daysInMonth,
                            teams: q.teams.map(t => ({
                              name: t.name,
                              region: t.region,
                              rawDkm: t.rawDkm,
                              dkmTarget: t.dkmTarget,
                              dkmKpiPct: t.dkmKpiPct,
                              yoy: t.hasYoy ? t.yoy : null,
                            })),
                          }}
                        />
                      </div>
                      <div className="text-[11px] text-slate-500 mb-3">{q.sub} · {q.teams.length} team</div>
                      {q.teams.length === 0 ? (
                        <div className="text-xs text-slate-600 italic">Không có team nào</div>
                      ) : (
                        <div className="flex flex-col gap-1.5">
                          {q.teams.map(t => {
                            const isExpanded = expandedCeoTeam === t.id;
                            const baseFlag = t.hasYoy && (t.yoy ?? 0) > 80 && t.dkmTarget !== null && t.prevDkm < (t.dkmTarget ?? 0) * 0.5;
                            // Fuzzy zone: 75–84% is borderline, not cleanly good/bad
                            const isBorderline = t.dkmKpiPct !== null && t.dkmKpiPct >= 75 && t.dkmKpiPct < 85;
                            const dkmPctColor = t.dkmKpiPct === null ? "text-slate-400"
                              : t.dkmKpiPct >= 85 ? "text-green-400"
                              : isBorderline    ? "text-amber-300"
                              : t.dkmKpiPct >= 60 ? "text-amber-400"
                              : "text-red-400";
                            // Momentum: MoM ĐKM direction for context
                            const mom = t.momTrend;
                            const momUp   = mom !== null && mom > 5;
                            const momDown = mom !== null && mom < -5;
                            // ĐKM revenue scale (projDkm) — consistent with Tiến độ % which is also ĐKM-based
                            // projRev (total DS) would be apples-vs-oranges since % is ĐKM-only
                            const revTy = (t.projDkm / 1000).toFixed(2);
                            return (
                              <div key={t.id} className="rounded-lg bg-slate-800/70 border border-slate-700/50 overflow-hidden">
                                {/* Summary row — always visible, click to expand */}
                                <div
                                  onClick={() => setExpandedCeoTeam(isExpanded ? null : t.id)}
                                  className="w-full px-3 py-2 flex items-center justify-between hover:bg-slate-700/40 transition-colors cursor-pointer"
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-xs font-semibold text-white">{t.name}</span>
                                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${t.region === "HN" ? "bg-green-900/60 text-green-400" : "bg-blue-900/60 text-blue-400"}`}>
                                        {t.region}
                                      </span>
                                      {baseFlag && <span className="text-[9px] px-1 py-0.5 rounded border border-amber-600/40 text-amber-400 font-mono">BASE↓</span>}
                                      {/* 3-month trend arrow — completed months only */}
                                      {momUp   && <span className="text-[9px] px-1 py-0.5 rounded bg-green-900/40 border border-green-600/30 text-green-400 font-mono" title={`DS ĐKM xu hướng tăng ${mom!.toFixed(0)}% (3 tháng thực tế)`}>↑ 3T</span>}
                                      {!momUp && !momDown && mom !== null && <span className="text-[9px] px-1 py-0.5 rounded bg-slate-700/60 border border-slate-600/40 text-slate-400 font-mono" title={`DS ĐKM đi ngang (3 tháng thực tế)`}>→ 3T</span>}
                                      {momDown && <span className="text-[9px] px-1 py-0.5 rounded bg-red-900/40 border border-red-600/30 text-red-400 font-mono" title={`DS ĐKM xu hướng giảm ${Math.abs(mom!).toFixed(0)}% (3 tháng thực tế)`}>↓ 3T</span>}
                                      <button
                                        onClick={e => { e.stopPropagation(); setEditingTeamNote(t.id); setTeamNoteInput(teamNotes[t.id] ?? ""); if (!isExpanded) setExpandedCeoTeam(t.id); }}
                                        title="Ghi chú"
                                        className={`flex-shrink-0 transition-opacity ${teamNotes[t.id] ? "opacity-70 hover:opacity-100" : "opacity-25 hover:opacity-70"}`}
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
                                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                        </svg>
                                      </button>
                                    </div>
                                    {teamNotes[t.id] && editingTeamNote !== t.id && (
                                      <div className="text-[10px] text-slate-400 italic mt-0.5 max-w-[160px] line-clamp-1 leading-tight">
                                        {teamNotes[t.id]}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-stretch gap-3 flex-shrink-0">
                                    {/* Tiến độ ĐKM */}
                                    {t.dkmKpiPct !== null && (
                                      <div className="text-center min-w-[40px]">
                                        <div className="text-[8px] text-slate-500 uppercase tracking-wide mb-0.5">
                                          {isProjected ? "Dự kiến" : "Thực tế"}
                                        </div>
                                        <div className={`text-[11px] font-bold font-mono leading-none ${dkmPctColor}`}>
                                          {isBorderline ? "≈" : ""}{t.dkmKpiPct}%
                                        </div>
                                        <div className="text-[8px] text-slate-500 font-mono mt-0.5">
                                          DS ĐKM {isProjected ? "~" : ""}{revTy} tỷ
                                        </div>
                                      </div>
                                    )}
                                    {/* Xu hướng 4 tháng */}
                                    <div className="text-center">
                                      <div className="text-[8px] text-slate-500 uppercase tracking-wide mb-1">4 tháng</div>
                                      <MiniSparkline vals={t.sparkVals} />
                                    </div>
                                    {/* So cùng kỳ 2025 */}
                                    {t.hasYoy && (
                                      <div className="text-center min-w-[40px]">
                                        <div className="text-[8px] text-slate-500 uppercase tracking-wide mb-0.5">So 2025</div>
                                        <div className={`text-[11px] font-semibold font-mono leading-none ${(t.yoy ?? 0) >= 0 ? "text-green-400" : "text-red-400"}`}>
                                          {(t.yoy ?? 0) >= 0 ? "▲" : "▼"}{Math.abs(t.yoy ?? 0).toFixed(1)}%
                                        </div>
                                      </div>
                                    )}
                                    <span className="text-slate-600 text-[10px] self-center">{isExpanded ? "▲" : "▼"}</span>
                                  </div>
                                </div>

                                {/* Detail panel — only when expanded */}
                                {isExpanded && (
                                  <div className="px-3 pb-3 pt-1 border-t border-slate-700/50 space-y-1.5">
                                    {/* ĐKM */}
                                    <div className="text-[9px] text-slate-600 uppercase tracking-wide">Doanh số Đăng Ký Mới</div>
                                    <div className="grid grid-cols-2 gap-1.5">
                                      <div className="rounded bg-slate-900/80 border border-slate-700/40 px-1.5 py-1">
                                        <div className="text-[9px] text-slate-500 uppercase tracking-wide mb-0.5">ĐKM thực tế</div>
                                        <div className="text-[11px] font-medium font-mono text-slate-200">{Math.round(t.rawDkm).toLocaleString()}M</div>
                                      </div>
                                      <div className="rounded bg-slate-900/80 border border-slate-700/40 px-1.5 py-1">
                                        <div className="text-[9px] text-slate-500 uppercase tracking-wide mb-0.5">ĐKM dự kiến</div>
                                        <div className="text-[11px] font-medium font-mono text-amber-300">{isProjected ? `~${Math.round(t.projDkm).toLocaleString()}M` : `${Math.round(t.projDkm).toLocaleString()}M`}</div>
                                      </div>
                                    </div>
                                    {/* ĐKM vs mục tiêu */}
                                    {t.dkmTarget !== null && (
                                      <div className="rounded bg-slate-900/80 border border-slate-700/40 px-2 py-1.5">
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="text-[9px] text-slate-500 uppercase tracking-wide">Tốc độ ĐKM vs kỳ vọng ({daysElapsed}/{daysInMonth} ngày)</span>
                                          <span className={`text-[11px] font-bold font-mono ${dkmPctColor}`}>{t.dkmKpiPct ?? "—"}%</span>
                                        </div>
                                        <div className="h-[3px] bg-slate-700 rounded-full overflow-hidden mb-1">
                                          <div className="h-full rounded-full transition-all"
                                            style={{ width: `${Math.min(t.dkmKpiPct ?? 0, 100)}%`,
                                                     backgroundColor: (t.dkmKpiPct ?? 0) >= 80 ? "#22c55e" : (t.dkmKpiPct ?? 0) >= 60 ? "#f59e0b" : "#ef4444" }} />
                                        </div>
                                        <div className="text-[9px] text-slate-600">
                                          Kỳ vọng đến nay: {Math.round(t.dkmTarget * paceRatio).toLocaleString()}M · Cả tháng: {Math.round(t.dkmTarget).toLocaleString()}M · {t.dkmTargetNote}
                                        </div>
                                      </div>
                                    )}
                                    {/* KPI DS tổng */}
                                    {t.target > 0 && (
                                      <div className="rounded bg-slate-900/80 border border-slate-700/40 px-2 py-1.5">
                                        <div className="mb-1 flex items-center justify-between text-[10px]">
                                          <span className="text-slate-500">DS tổng thực: <span className="text-slate-300 font-mono">{Math.round(t.rawRev).toLocaleString()}M</span></span>
                                          {isProjected
                                            ? <span className="text-slate-500">Dự kiến: <span className="text-amber-300 font-mono">~{Math.round(t.projRev).toLocaleString()}M</span> / {t.target.toLocaleString()}M</span>
                                            : <span className="text-slate-500">Mục tiêu: <span className="text-slate-300 font-mono">{t.target.toLocaleString()}M</span></span>
                                          }
                                        </div>
                                        <KpiBar pct={t.kpiPct} projected={isProjected} />
                                      </div>
                                    )}
                                    {/* Ghi chú */}
                                    {editingTeamNote === t.id ? (
                                      <div className="flex flex-col gap-1 pt-1">
                                        <div className="text-[9px] text-slate-500 uppercase tracking-wide">Ghi chú</div>
                                        <textarea
                                          value={teamNoteInput}
                                          onChange={e => setTeamNoteInput(e.target.value)}
                                          onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) saveTeamNote(t.id, teamNoteInput); if (e.key === "Escape") setEditingTeamNote(null); }}
                                          className="w-full text-[11px] bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white resize-none focus:outline-none focus:border-blue-500"
                                          rows={2}
                                          placeholder="Nhập ghi chú (Ctrl+Enter để lưu)..."
                                          autoFocus
                                        />
                                        <div className="flex gap-1.5">
                                          <button onClick={() => saveTeamNote(t.id, teamNoteInput)} className="px-2 py-0.5 text-[10px] bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors">Lưu</button>
                                          {teamNotes[t.id] && <button onClick={() => saveTeamNote(t.id, "")} className="px-2 py-0.5 text-[10px] bg-red-900/60 text-red-300 rounded hover:bg-red-900 transition-colors">Xóa</button>}
                                          <button onClick={() => setEditingTeamNote(null)} className="px-2 py-0.5 text-[10px] bg-slate-600 text-slate-300 rounded hover:bg-slate-500 transition-colors">Hủy</button>
                                        </div>
                                      </div>
                                    ) : teamNotes[t.id] ? (
                                      <div className="rounded bg-slate-900/60 border border-slate-700/40 px-2 py-1.5">
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="text-[10px] text-slate-300 italic leading-snug whitespace-pre-wrap">{teamNotes[t.id]}</div>
                                          <button onClick={() => { setEditingTeamNote(t.id); setTeamNoteInput(teamNotes[t.id]); }} className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity mt-0.5">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                          </button>
                                        </div>
                                      </div>
                                    ) : null}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Legend footer */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 px-3 py-2 rounded-lg border border-slate-700/50 bg-slate-800/40 text-[11px] text-slate-400">
                  <span><span className="inline-block w-2 h-2 rounded-sm bg-blue-400 mr-1"/>Sparkline xu hướng ĐKM 4 tháng gần nhất</span>
                  <span className="px-1 py-0.5 rounded border border-amber-600/40 text-amber-400 text-[10px] font-mono">BASE↓</span>
                  <span>YoY cao bất thường do cùng kỳ 2025 base thấp</span>
                  <span className="text-slate-500">·</span>
                  <span>Mục tiêu ĐKM = tỉ lệ ĐKM/DS CK2025 × 1.1 × KH tháng · Reseller dùng tỉ lệ riêng không nhân 1.1</span>
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* Phần 4b: Vị Thế Nhóm Dịch Vụ theo Khu Vực */}
        {hasPrevYearTeamData && (() => {
          const now4b        = new Date();
          const selMo4b      = parseInt(selectedMonth.replace("T", ""));
          const isCurMo4b    = view === "month" && selMo4b === now4b.getMonth() + 1;
          const daysInMo4b   = new Date(now4b.getFullYear(), selMo4b, 0).getDate();
          const daysElapsed4b = isCurMo4b ? now4b.getDate() : daysInMo4b;
          const pace4b        = Math.min(daysElapsed4b / daysInMo4b, 1);
          const proj4b = (v: number) => isCurMo4b && pace4b < 1 ? v / pace4b : v;

          const svcData = SVC_KEYS.map(sk => {
            const hnTeams  = displayed.filter(t => t.region === "HN");
            const hcmTeams = displayed.filter(t => t.region === "HCM");
            const hnRaw    = hnTeams.reduce((s, t) => s + ((t as any)[sk.key] ?? 0), 0);
            const hcmRaw   = hcmTeams.reduce((s, t) => s + ((t as any)[sk.key] ?? 0), 0);
            const hnDkm    = proj4b(hnRaw);
            const hcmDkm   = proj4b(hcmRaw);
            const hnPrevDkm  = hnTeams.reduce((s, t)  => s + ((prevYearTeamMap[t.teamId] as any)?.[sk.key] ?? 0), 0);
            const hcmPrevDkm = hcmTeams.reduce((s, t) => s + ((prevYearTeamMap[t.teamId] as any)?.[sk.key] ?? 0), 0);
            const hnYoy  = hnPrevDkm  > 0 ? ((hnDkm  - hnPrevDkm)  / hnPrevDkm  * 100) : null;
            const hcmYoy = hcmPrevDkm > 0 ? ((hcmDkm - hcmPrevDkm) / hcmPrevDkm * 100) : null;
            return { service: sk.label, hnDkm: Math.round(hnDkm), hcmDkm: Math.round(hcmDkm), hnYoy, hcmYoy };
          }).filter(d => d.hnDkm > 0 || d.hcmDkm > 0);

          if (svcData.length === 0) return null;

          return (
            <Card>
              <CardHeader className="flex-col items-start gap-1">
                <CardTitle className="text-sm font-semibold text-slate-200">Vị Thế Nhóm Dịch Vụ theo Khu Vực</CardTitle>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-2.5 rounded-sm bg-blue-500/70 inline-block"/>HN ĐKM (triệu VNĐ)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-2.5 rounded-sm bg-orange-500/70 inline-block"/>HCM ĐKM (triệu VNĐ)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-6 border-t-2 border-dashed border-blue-400"/>HN YoY%
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-6 border-t-2 border-dashed border-orange-400"/>HCM YoY%
                  </span>
                  <span className="text-slate-500">· Đường nét đứt trên/dưới 0% = tăng/giảm so cùng kỳ 2025</span>
                  {isCurMo4b && pace4b < 1 && (
                    <span className="text-amber-400/80">⚠ Tháng chưa kết thúc — DS đã quy đổi theo tốc độ {daysElapsed4b}/{daysInMo4b} ngày (ước tính ±15%)</span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={svcData} margin={{ top: 10, right: 50, bottom: 5, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="service" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <YAxis
                      yAxisId="left"
                      tick={{ fill: "#94a3b8", fontSize: 10 }}
                      tickFormatter={v => `${v.toLocaleString()}M`}
                      width={60}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fill: "#94a3b8", fontSize: 10 }}
                      tickFormatter={v => `${v > 0 ? "+" : ""}${v.toFixed(0)}%`}
                      width={45}
                    />
                    <ReferenceLine yAxisId="right" y={0} stroke="#475569" strokeDasharray="4 4" label={{ value: "0%", fill: "#64748b", fontSize: 10, position: "right" }} />
                    <Tooltip
                      content={({ payload, label }) => {
                        if (!payload?.length) return null;
                        return (
                          <div className="bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-xs shadow-xl">
                            <div className="font-bold text-white mb-1.5">{label}</div>
                            {payload.map((p: any) => (
                              <div key={p.name} style={{ color: p.color }} className="flex items-center justify-between gap-3">
                                <span>{p.name}:</span>
                                <span className="font-semibold">
                                  {p.name.includes("YoY")
                                    ? (p.value != null ? `${p.value > 0 ? "+" : ""}${Number(p.value).toFixed(1)}%` : "—")
                                    : `${Number(p.value).toLocaleString()}M`}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      }}
                    />
                    <Bar yAxisId="left"  dataKey="hnDkm"  name="HN ĐKM"   fill="#3b82f6" fillOpacity={0.7} radius={[3,3,0,0]} />
                    <Bar yAxisId="left"  dataKey="hcmDkm" name="HCM ĐKM"  fill="#f97316" fillOpacity={0.7} radius={[3,3,0,0]} />
                    <Line yAxisId="right" type="monotone" dataKey="hnYoy"  name="HN YoY%"  stroke="#60a5fa" strokeWidth={2} strokeDasharray="5 3" dot={{ fill: "#60a5fa", r: 4 }} connectNulls />
                    <Line yAxisId="right" type="monotone" dataKey="hcmYoy" name="HCM YoY%" stroke="#fb923c" strokeWidth={2} strokeDasharray="5 3" dot={{ fill: "#fb923c", r: 4 }} connectNulls />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          );
        })()}

        {/* Phần 3: Radar + Top Team per Service */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>
                    {radarSelectedTeam
                      ? `Radar: ${radarSelectedTeam.teamName} vs TB ${radarSelectedTeam.region}`
                      : "Radar: Thế Mạnh Dịch Vụ Đăng Ký Mới HN vs HCM"}
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {radarSelectedTeam ? `So sánh team với trung bình khu vực ${radarSelectedTeam.region}` : "So sánh tổng ĐKM theo loại dịch vụ giữa 2 khu vực"}
                  </p>
                </div>
                {/* Team dropdown */}
                <select
                  value={radarTeamId ?? ""}
                  onChange={e => setRadarTeamId(e.target.value || null)}
                  className="text-xs bg-slate-800 border border-slate-600 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="">HN vs HCM</option>
                  {[...hnTeams, ...hcmTeams].map(t => (
                    <option key={t.teamId} value={t.teamId}>{t.teamName} ({t.region})</option>
                  ))}
                </select>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <PolarRadiusAxis tick={{ fill: "#475569", fontSize: 9 }} />
                  {radarSelectedTeam ? (
                    <>
                      <Radar name={radarSelectedTeam.teamName} dataKey={radarSelectedTeam.teamName}
                        stroke={radarSelectedTeam.region === "HN" ? "#3b82f6" : "#f97316"}
                        fill={radarSelectedTeam.region === "HN" ? "#3b82f6" : "#f97316"} fillOpacity={0.35} />
                      <Radar name={`TB ${radarSelectedTeam.region}`} dataKey={`TB ${radarSelectedTeam.region}`}
                        stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.15} strokeDasharray="4 3" />
                    </>
                  ) : (
                    <>
                      <Radar name="HN"  dataKey="HN"  stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                      <Radar name="HCM" dataKey="HCM" stroke="#f97316" fill="#f97316" fillOpacity={0.3} />
                    </>
                  )}
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

          // Lọc source theo region, và theo team nếu đang chọn team cụ thể
          const filterSource = (source: TeamMonthlyData) =>
            source.map(m => ({
              ...m,
              teams: m.teams.filter(t =>
                (region === "all" || t.region === region) &&
                (trendTeamId === null || t.teamId === trendTeamId)
              ),
            }));
          const src     = filterSource(allMonths);
          const srcPrev = filterSource(allPrevMonths);

          // Danh sách team để hiện tab (theo region filter)
          const trendTeamList = (() => {
            const regionFiltered = region === "all" ? allMonths : allMonths.map(m => ({ ...m, teams: m.teams.filter(t => t.region === region) }));
            const map: Record<string, { teamId: string; teamName: string; region: string }> = {};
            regionFiltered.forEach(m => m.teams.forEach(t => { if (!map[t.teamId]) map[t.teamId] = { teamId: t.teamId, teamName: t.teamName, region: t.region }; }));
            return Object.values(map);
          })();

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

          const curMk      = monthsWithData.includes(selectedMonth) ? selectedMonth : monthsWithData[monthsWithData.length - 1];
          const curMkIdx   = monthsWithData.indexOf(curMk);
          const prevMk     = curMkIdx > 0 ? monthsWithData[curMkIdx - 1] : null;
          const sparkMonths = monthsWithData.slice(Math.max(0, curMkIdx - 5), curMkIdx + 1);

          const todayMonth   = `T${new Date().getMonth() + 1}`;
          const isCurrentMonth = curMk === todayMonth;
          const daysElapsed  = new Date().getDate();
          const daysInMonth  = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
          const paceRatio    = daysElapsed / daysInMonth;
          const paceLabel    = `${daysElapsed}/${daysInMonth} ngày`;

          const trendRows = SVC_KEYS.map(s => {
            const sparkVals = sparkMonths.map(mk => svcSum(mk, s.key, src));
            const cur       = svcSum(curMk, s.key, src);
            const projected = isCurrentMonth && paceRatio > 0 ? cur / paceRatio : cur;
            const prev      = prevMk ? svcSum(prevMk, s.key, src) : null;
            const prevYear  = svcSum(curMk, s.key, srcPrev);
            const mom = (projected > 0 && prev != null && prev > 0) ? ((projected - prev) / prev * 100) : null;
            const yoy = (projected > 0 && prevYear > 0)             ? ((projected - prevYear) / prevYear * 100) : null;
            // Signal: synthesize MoM + YoY
            const signal: "green" | "yellow" | "red" | "new" =
              cur === 0 && prevYear === 0 ? "new"
              : mom === null && yoy === null ? "yellow"
              : (mom ?? 0) >= 0 && (yoy ?? 0) >= 0 ? "green"
              : (mom ?? 0) <  0 && (yoy ?? 0) <  0 ? "red"
              : "yellow";
            return { ...s, sparkVals, cur, projected, prev, prevYear, mom, yoy, signal };
          });

          const maxSpark = Math.max(...trendRows.flatMap(r => r.sparkVals), 1);

          function Sparkline({ vals, color }: { vals: number[]; color: string }) {
            const h = 28, w = 72, n = vals.length;
            if (n < 2) return <span className="text-slate-600 text-xs">—</span>;
            const pts = vals.map((v, i) => `${(i/(n-1))*w},${h-(v/maxSpark)*h}`).join(" ");
            return (
              <svg width={w} height={h} className="inline-block">
                <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" opacity={0.8} />
                {vals[n-1] > 0 && <circle cx={(n-1)/(n-1)*w} cy={h-(vals[n-1]/maxSpark)*h} r="2.5" fill={color} />}
              </svg>
            );
          }

          function SignalBadge({ signal, mom, yoy }: { signal: string; mom: number | null; yoy: number | null }) {
            const cfg = {
              green:  { dot: "bg-green-400",  label: "Tăng trưởng", cls: "bg-green-500/15 text-green-300 border-green-500/30"    },
              yellow: { dot: "bg-amber-400",  label: "Theo dõi",    cls: "bg-amber-500/15 text-amber-300 border-amber-500/30"    },
              red:    { dot: "bg-red-400",    label: "Cảnh báo",    cls: "bg-red-500/15   text-red-300   border-red-500/30"      },
              new:    { dot: "bg-slate-400",  label: "Mới/Trống",   cls: "bg-slate-500/15 text-slate-400 border-slate-500/30"    },
            }[signal] ?? { dot: "bg-slate-400", label: "—", cls: "bg-slate-500/15 text-slate-400 border-slate-500/30" };
            return (
              <div className={`inline-flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg border text-[10px] font-medium min-w-[72px] ${cfg.cls}`}>
                <div className="flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  <span className="font-semibold">{cfg.label}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] opacity-80">
                  {mom !== null && <span>MoM {mom >= 0 ? "+" : ""}{mom.toFixed(0)}%</span>}
                  {yoy !== null && <span>YoY {yoy >= 0 ? "▲" : "▼"}{Math.abs(yoy).toFixed(0)}%</span>}
                </div>
              </div>
            );
          }

          const selectedTeam = trendTeamList.find(t => t.teamId === trendTeamId);

          return (
            <Card>
              <CardHeader className="flex-col items-start gap-0">
                <div className="flex items-start justify-between gap-3 w-full">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm font-semibold text-slate-200">Xu Hướng Nhóm Sản Phẩm — Đăng Ký Mới</CardTitle>
                    <div className="flex items-center gap-3 flex-wrap text-xs text-slate-400 mt-1">
                      <span>So sánh {curMk}{prevMk ? ` vs ${prevMk}` : ""} · Sparkline {sparkMonths[0] ?? curMk}–{curMk}</span>
                      {isCurrentMonth && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-medium">
                          ⏱ Pace {paceLabel} · MoM/YoY tính theo dự báo full-month
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <MiniAiPanel context="trend" label="AI nhận xét" data={{ period: curMk, region, team: selectedTeam?.teamName ?? "Tổng hợp", isPaceMonth: isCurrentMonth, paceLabel, rows: trendRows.map(r => ({ label: r.label, cur: r.cur, projected: r.projected, mom: r.mom, yoy: r.yoy, signal: r.signal })) }} />
                  </div>
                </div>
                {/* Team filter tabs */}
                <div className="flex flex-wrap gap-1 mt-3">
                  <button
                    onClick={() => setTrendTeamId(null)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${trendTeamId === null ? "bg-slate-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}
                  >
                    Tổng hợp
                  </button>
                  {trendTeamList.map(t => (
                    <button
                      key={t.teamId}
                      onClick={() => setTrendTeamId(t.teamId)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${trendTeamId === t.teamId
                        ? t.region === "HN" ? "bg-blue-600 text-white" : "bg-orange-600 text-white"
                        : "bg-slate-800 text-slate-400 hover:text-white"}`}
                    >
                      {t.teamName}
                      <span className={`ml-1 text-[10px] opacity-70 ${t.region === "HN" ? "text-blue-300" : "text-orange-300"}`}>{t.region}</span>
                    </button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-xs" style={{ minWidth: 560 }}>
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-2 px-3 text-slate-400 w-28">Nhóm SP</th>
                      <th className="text-center py-2 px-3 text-slate-400">Xu hướng</th>
                      <th className="text-right py-2 px-3 text-slate-300 font-medium">
                        {curMk}{isCurrentMonth ? " thực tế" : ""} (M)
                      </th>
                      {isCurrentMonth && <th className="text-right py-2 px-3 text-amber-400/70 font-medium">Dự báo (M)</th>}
                      {prevMk && <th className="text-right py-2 px-3 text-slate-500">{prevMk} (M)</th>}
                      <th className="text-center py-2 px-3 text-slate-400 font-medium">Tín hiệu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trendRows
                      .sort((a, b) => {
                        const order = { red: 0, yellow: 1, green: 2, new: 3 };
                        return (order[a.signal] ?? 3) - (order[b.signal] ?? 3);
                      })
                      .map(r => (
                      <tr key={r.key} className="border-b border-slate-800 hover:bg-slate-800/30">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1">
                            <span className="font-semibold" style={{ color: r.color }}>{r.label}</span>
                            <button
                              onClick={() => { setEditingNote(r.key); setNoteInput(svcNotes[r.key] ?? ""); }}
                              title="Ghi chú"
                              className={`flex-shrink-0 transition-opacity ${svcNotes[r.key] ? "opacity-70 hover:opacity-100" : "opacity-25 hover:opacity-70"}`}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                            </button>
                          </div>
                          {svcNotes[r.key] && editingNote !== r.key && (
                            <div className="text-[10px] text-slate-400 italic mt-0.5 max-w-[140px] line-clamp-2 leading-tight">
                              {svcNotes[r.key]}
                            </div>
                          )}
                          {editingNote === r.key && (
                            <div className="mt-1.5 flex flex-col gap-1 min-w-[180px]">
                              <textarea
                                value={noteInput}
                                onChange={e => setNoteInput(e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) saveNote(r.key, noteInput); if (e.key === "Escape") setEditingNote(null); }}
                                className="w-full text-[11px] bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white resize-none focus:outline-none focus:border-blue-500"
                                rows={2}
                                placeholder="Nhập ghi chú (Ctrl+Enter để lưu)..."
                                autoFocus
                              />
                              <div className="flex gap-1.5">
                                <button onClick={() => saveNote(r.key, noteInput)} className="px-2 py-0.5 text-[10px] bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors">Lưu</button>
                                {svcNotes[r.key] && <button onClick={() => saveNote(r.key, "")} className="px-2 py-0.5 text-[10px] bg-red-900/60 text-red-300 rounded hover:bg-red-900 transition-colors">Xóa</button>}
                                <button onClick={() => setEditingNote(null)} className="px-2 py-0.5 text-[10px] bg-slate-600 text-slate-300 rounded hover:bg-slate-500 transition-colors">Hủy</button>
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <Sparkline vals={r.sparkVals} color={r.color} />
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-white tabular-nums">
                          {r.cur > 0 ? r.cur.toLocaleString() : "—"}
                        </td>
                        {isCurrentMonth && (
                          <td className="py-2.5 px-3 text-right tabular-nums text-amber-300/80 font-medium">
                            {r.projected > 0 ? `~${Math.round(r.projected).toLocaleString()}` : "—"}
                          </td>
                        )}
                        {prevMk && (
                          <td className="py-2.5 px-3 text-right text-slate-500 tabular-nums">
                            {r.prev != null && r.prev > 0 ? r.prev.toLocaleString() : "—"}
                          </td>
                        )}
                        <td className="py-2.5 px-3 text-center">
                          <SignalBadge signal={r.signal} mom={r.mom} yoy={r.yoy} />
                        </td>
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
                      {isCurrentMonth && (
                        <td className="py-2 px-3 text-right font-bold text-amber-300 tabular-nums">
                          ~{Math.round(trendRows.reduce((s,r) => s + r.projected, 0)).toLocaleString()}
                        </td>
                      )}
                      {prevMk && (
                        <td className="py-2 px-3 text-right font-semibold text-slate-400 tabular-nums">
                          {trendRows.reduce((s,r) => s + (r.prev ?? 0), 0).toLocaleString()}
                        </td>
                      )}
                      {(() => {
                        const totProj = trendRows.reduce((s,r) => s + r.projected, 0);
                        const totPrev = trendRows.reduce((s,r) => s + (r.prev ?? 0), 0);
                        const totYoy  = trendRows.reduce((s,r) => s + r.prevYear, 0);
                        const momTot  = totPrev > 0 ? ((totProj - totPrev) / totPrev * 100) : null;
                        const yoyTot  = totYoy  > 0 ? ((totProj - totYoy)  / totYoy  * 100) : null;
                        const sig: "green" | "yellow" | "red" = momTot !== null && yoyTot !== null
                          ? momTot >= 0 && yoyTot >= 0 ? "green" : momTot < 0 && yoyTot < 0 ? "red" : "yellow"
                          : "yellow";
                        return (
                          <td className="py-2 px-3 text-center">
                            <SignalBadge signal={sig} mom={momTot} yoy={yoyTot} />
                          </td>
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
            <div className="flex items-start justify-between gap-3">
              <CardTitle>Ma Trận Doanh Số Đăng Ký Mới theo Loại Dịch Vụ (triệu VNĐ)</CardTitle>
              <MiniAiPanel context="heatmap" label="AI nhận xét" data={{
                period: filterLabel, region, benchmark,
                teams: displayed.map(t => ({
                  name: t.teamName, region: t.region,
                  totalDs: t.revenue, totalDkm: DKM_SVC_KEYS.reduce((s, sk) => s + ((t as any)[sk.key] ?? 0), 0),
                  services: Object.fromEntries(SVC_KEYS.map(sk => [sk.label, (t as any)[sk.key] ?? 0])),
                }))
              }} />
            </div>
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
                    const svcTotal = DKM_SVC_KEYS.reduce((sum, s) => sum + ((team as any)[s.key] ?? 0), 0);
                    const ratio = team.revenue > 0 ? Math.round((svcTotal / team.revenue) * 100) : 0;
                    const prev = prevYearTeamMap[team.teamId];
                    const prevSvcTotal = DKM_SVC_KEYS.reduce((sum, s) => sum + ((prev as any)?.[s.key] ?? 0), 0);
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
                  const regSvc = regTeams.reduce((sum, t) => sum + DKM_SVC_KEYS.reduce((s, sk) => s + ((t as any)[sk.key] ?? 0), 0), 0);
                  const prevRegSvc = regTeams.reduce((sum, t) => sum + DKM_SVC_KEYS.reduce((s, sk) => s + ((prevYearTeamMap[t.teamId] as any)?.[sk.key] ?? 0), 0), 0);
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
