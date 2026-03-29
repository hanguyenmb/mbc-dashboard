"use client";

import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Legend, LabelList,
} from "recharts";
import { Header, PageHeader } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Sparkles, TrendingUp, TrendingDown, MapPin } from "lucide-react";
import { AiAnalysisPanel } from "@/components/ai/ai-analysis-panel";
import { TEAM_SERVICE_DATA } from "@/lib/mock-data";
import type { UserRole, TeamMonthlyData, TeamServiceRecord } from "@/lib/types";

interface TeamsClientProps {
  role: UserRole;
  teamId: string | null;
  teamServiceData: TeamMonthlyData;
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

export function TeamsClient({ role, teamId, teamServiceData }: TeamsClientProps) {
  const [showAI, setShowAI] = useState(false);
  const [region, setRegion] = useState<"all" | "HN" | "HCM">("all");
  const [view, setView] = useState<"month" | "quarter">("month");
  const [selectedMonth, setSelectedMonth] = useState("T3");
  const [selectedQuarter, setSelectedQuarter] = useState(1);
  const [openDropdown, setOpenDropdown] = useState<"month" | "quarter" | null>(null);

  const allMonths = teamServiceData.length > 0 ? teamServiceData : TEAM_SERVICE_DATA;

  // Aggregate teams cho 1 tháng hoặc 1 quý
  function getTeamsForMonths(monthKeys: string[]) {
    const map: Record<string, import("@/lib/types").TeamServiceRecord> = {};
    for (const mk of monthKeys) {
      const teams = allMonths.find(m => m.month === mk)?.teams ?? [];
      for (const t of teams) {
        if (!map[t.teamId]) {
          map[t.teamId] = { ...t, revenue: 0, target: 0, hostMail: 0, msgws: 0, tenMien: 0, transferGws: 0, saleAi: 0, elastic: 0 };
        }
        map[t.teamId].revenue     += t.revenue;
        map[t.teamId].target      += t.target;
        map[t.teamId].hostMail    += t.hostMail;
        map[t.teamId].msgws       += t.msgws;
        map[t.teamId].tenMien     += t.tenMien;
        map[t.teamId].transferGws += t.transferGws;
        map[t.teamId].saleAi      += t.saleAi;
        map[t.teamId].elastic     += t.elastic;
      }
    }
    return Object.values(map);
  }

  const allTeams = view === "month"
    ? getTeamsForMonths([selectedMonth])
    : getTeamsForMonths(QUARTER_MONTHS[selectedQuarter]);

  const hnTeams  = allTeams.filter(t => t.region === "HN");
  const hcmTeams = allTeams.filter(t => t.region === "HCM");
  const displayed = region === "all" ? allTeams : allTeams.filter(t => t.region === region);

  const filterLabel = view === "month" ? selectedMonth : `Q${selectedQuarter}`;

  // Ranking chart data
  const rankingData = [...displayed]
    .sort((a, b) => b.revenue - a.revenue)
    .map(t => ({
      name: t.teamName,
      revenue: t.revenue,
      target: t.target,
      pct: pct(t.revenue, t.target),
      color: t.region === "HN" ? "#3b82f6" : "#f97316",
    }));

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
          const hnRev       = hnTeams.reduce((s, t) => s + t.revenue, 0);
          const hcmRev      = hcmTeams.reduce((s, t) => s + t.revenue, 0);
          const hnShare     = totalRev > 0 ? Math.round((hnRev / totalRev) * 100) : 0;
          const hcmShare    = totalRev > 0 ? Math.round((hcmRev / totalRev) * 100) : 0;
          return (
            <div className="rounded-xl border border-slate-600/50 bg-slate-800/40 p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-xs text-slate-400 font-medium mb-1 uppercase tracking-wide">
                    Tổng Doanh Số Toàn Quốc — {view === "month" ? selectedMonth : `Q${selectedQuarter}`}
                  </div>
                  <div className="text-4xl font-bold text-white">{totalRev.toLocaleString()}<span className="text-xl text-slate-400 ml-1">M</span></div>
                  <div className="text-sm text-slate-400 mt-1">Mục tiêu: <span className="text-white font-medium">{totalTarget.toLocaleString()}M</span></div>
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
                  <div className="text-xl font-bold text-white">{hnRev.toLocaleString()}<span className="text-sm text-slate-400 ml-1">M</span></div>
                  <div className="text-xs text-slate-400 mt-0.5">{hnTeams.length} team · MT: {hnTeams.reduce((s,t)=>s+t.target,0).toLocaleString()}M</div>
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
                  <div className="text-xl font-bold text-white">{hcmRev.toLocaleString()}<span className="text-sm text-slate-400 ml-1">M</span></div>
                  <div className="text-xs text-slate-400 mt-0.5">{hcmTeams.length} team · MT: {hcmTeams.reduce((s,t)=>s+t.target,0).toLocaleString()}M</div>
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
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(200, rankingData.length * 52)}>
                <BarChart data={rankingData} layout="vertical" margin={{ left: 16, right: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={v => `${v.toLocaleString()}M`} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#cbd5e1", fontSize: 12 }} width={90} />
                  <Tooltip {...TOOLTIP_STYLE} formatter={(v: any) => [`${Number(v).toLocaleString()}M`, "Doanh số"]} />
                  <Bar dataKey="revenue" radius={[0, 6, 6, 0]}>
                    <LabelList dataKey="pct" position="right" content={(props: any) => {
                      const { x, y, width, height, value } = props;
                      const color = value >= 100 ? "#4ade80" : "#f87171";
                      return <text x={x + width + 8} y={y + height / 2 + 4} fill={color} fontSize={11} fontWeight={600}>{value}%</text>;
                    }} />
                    {rankingData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Phần 3: Heatmap team × dịch vụ */}
        <Card>
          <CardHeader>
            <CardTitle>Ma Trận Doanh Số Đăng Ký Mới theo Loại Dịch Vụ (triệu VNĐ)</CardTitle>
            <Badge variant="neutral">Màu càng sáng = doanh số càng cao</Badge>
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
                  <th className="text-right py-2 px-3 text-slate-400 font-medium">Tỉ lệ ĐKM/Tổng DS</th>
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
                          const intensity = maxSvc[s.key] > 0 ? val / maxSvc[s.key] : 0;
                          const r = parseInt(s.color.slice(1,3),16);
                          const g = parseInt(s.color.slice(3,5),16);
                          const b = parseInt(s.color.slice(5,7),16);
                          return (
                            <td key={s.key} className="py-2 px-3 text-right font-mono"
                              style={{ color: `rgba(${r},${g},${b},${0.45 + intensity * 0.55})` }}>
                              {val > 0 ? val.toLocaleString() : "—"}
                            </td>
                          );
                        })}
                        <td className="py-2 px-3 text-right font-semibold text-white">{svcTotal > 0 ? svcTotal.toLocaleString() : "—"}</td>
                        <td className={`py-2 px-3 text-right font-bold ${thresholdColor(ratio)}`}>
                          {team.revenue > 0 ? `${ratio}%` : "—"}
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Phần 4: Radar + Top Team per Service */}
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

      {showAI && (
        <AiAnalysisPanel context="teams" data={allTeams} onClose={() => setShowAI(false)} />
      )}
    </div>
  );
}
