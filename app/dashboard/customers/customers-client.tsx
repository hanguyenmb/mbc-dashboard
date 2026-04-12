"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MiniAiPanel } from "@/components/ai/mini-ai-panel";
import { TEAM_SERVICE_DATA } from "@/lib/mock-data";
import type { UserRole, TeamMonthlyData, TeamServiceRecord, ServiceConfig } from "@/lib/types";
import { DEFAULT_SERVICE_CONFIG } from "@/lib/types";

interface CustomersClientProps {
  role: UserRole;
  teamId: string | null;
  teamServiceData: TeamMonthlyData;
  teamPrevData: TeamMonthlyData;
  serviceConfig: ServiceConfig[];
}

const QUARTER_MONTHS: Record<number, string[]> = {
  1: ["T1","T2","T3"], 2: ["T4","T5","T6"],
  3: ["T7","T8","T9"], 4: ["T10","T11","T12"],
};

export function CustomersClient({ role, teamId, teamServiceData, teamPrevData, serviceConfig }: CustomersClientProps) {
  const SVC_KEYS: ServiceConfig[] = serviceConfig?.length ? serviceConfig : DEFAULT_SERVICE_CONFIG;
  const DKM_SVC_KEYS = SVC_KEYS.filter(s => s.key !== 'elastic');

  const [region, setRegion] = useState<"all" | "HN" | "HCM">("all");
  const [view, setView] = useState<"month" | "quarter">("month");
  const [selectedMonth, setSelectedMonth] = useState(`T${new Date().getMonth() + 1}`);
  const [selectedQuarter, setSelectedQuarter] = useState(1);
  const [openDropdown, setOpenDropdown] = useState<"month" | "quarter" | null>(null);

  const allMonths = teamServiceData.length > 0 ? teamServiceData : TEAM_SERVICE_DATA;
  const allPrevMonths = teamPrevData.length > 0 ? teamPrevData : [];

  // ── Pace calculation (current month only) ──────────────────────────────────
  const now = new Date();
  const selMoNum = view === "month" ? parseInt(selectedMonth.replace("T", "")) : null;
  const isCurrentMonth = view === "month" && selMoNum === now.getMonth() + 1;
  const daysInCurMonth = isCurrentMonth ? new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() : 30;
  const daysElapsed = isCurrentMonth ? now.getDate() : daysInCurMonth;
  const paceRatio = isCurrentMonth && daysElapsed < daysInCurMonth ? daysElapsed / daysInCurMonth : 1;
  const proj = (v: number) => paceRatio < 1 ? v / paceRatio : v;
  const paceLabel = isCurrentMonth && paceRatio < 1 ? `${daysElapsed}/${daysInCurMonth} ngày` : null;

  function getTeamsForMonths(monthKeys: string[], source = allMonths) {
    const map: Record<string, TeamServiceRecord> = {};
    for (const mk of monthKeys) {
      const teams = source.find(m => m.month === mk)?.teams ?? [];
      for (const t of teams) {
        if (!map[t.teamId]) {
          const base: any = { ...t, revenue: 0, target: 0, customerCount: 0 };
          SVC_KEYS.forEach(s => { base[s.key] = 0; });
          map[t.teamId] = base;
        }
        map[t.teamId].revenue       += t.revenue;
        map[t.teamId].target        += t.target;
        map[t.teamId].customerCount += (t.customerCount ?? 0);
        SVC_KEYS.forEach(s => {
          (map[t.teamId] as any)[s.key] = ((map[t.teamId] as any)[s.key] ?? 0) + ((t as any)[s.key] ?? 0);
        });
        if ((t as any).customerCountDkm != null) {
          (map[t.teamId] as any).customerCountDkm = ((map[t.teamId] as any).customerCountDkm ?? 0) + (t as any).customerCountDkm;
        }
      }
    }
    return Object.values(map);
  }

  const monthKeys = view === "month" ? [selectedMonth] : QUARTER_MONTHS[selectedQuarter];
  const allTeams = getTeamsForMonths(monthKeys);
  const prevYearTeams = allPrevMonths.length > 0 ? getTeamsForMonths(monthKeys, allPrevMonths) : [];
  const prevYearTeamMap = Object.fromEntries(prevYearTeams.map(t => [t.teamId, t]));

  const displayed = region === "all" ? allTeams : allTeams.filter(t => t.region === region);
  const filterLabel = view === "month" ? selectedMonth : `Q${selectedQuarter}`;

  const months = Array.from(new Set(allMonths.map(m => m.month))).sort((a,b) => {
    const na = parseInt(a.replace("T","")); const nb = parseInt(b.replace("T",""));
    return na - nb;
  });

  // ── Báo Cáo Khách Hàng ──────────────────────────────────────────────────────
  const hasKhData = displayed.some(t => (t.customerCount ?? 0) > 0);
  const hasPrevKhData = prevYearTeams.some(t => (t.customerCount ?? 0) > 0);

  const rows = displayed.map(t => {
    const prev = prevYearTeamMap[t.teamId];
    const kh = t.customerCount ?? 0;
    const prevKh = prev?.customerCount ?? 0;
    const ds = t.revenue;
    const prevDs = prev?.revenue ?? 0;
    const avgDs = kh > 0 ? ds / kh : 0;
    const prevAvgDs = prevKh > 0 ? prevDs / prevKh : 0;
    // Pace-adjusted YoY: so projected (tốc độ hiện tại × cả tháng) vs prev full-month
    const khYoy  = (kh > 0 && prevKh > 0)       ? ((proj(kh)    - prevKh)    / prevKh    * 100) : null;
    const dsYoy  = (ds > 0 && prevDs > 0)        ? ((proj(ds)    - prevDs)    / prevDs    * 100) : null;
    const avgYoy = (avgDs > 0 && prevAvgDs > 0)  ? ((avgDs - prevAvgDs) / prevAvgDs * 100) : null;
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
    const khYoy  = (kh > 0 && prevKh > 0)       ? ((proj(kh)    - prevKh)    / prevKh    * 100) : null;
    const dsYoy  = (ds > 0 && prevDs > 0)        ? ((proj(ds)    - prevDs)    / prevDs    * 100) : null;
    const avgYoy = (avgDs > 0 && prevAvgDs > 0)  ? ((avgDs - prevAvgDs) / prevAvgDs * 100) : null;
    return { reg, kh, ds, avgDs, khYoy, dsYoy, avgYoy };
  }).filter(Boolean) as { reg: string; kh: number; ds: number; avgDs: number; khYoy: number|null; dsYoy: number|null; avgYoy: number|null; }[];

  // ── TB DS ĐKM / KH ──────────────────────────────────────────────────────────
  const dkmRows = rows.map(r => {
    const khDkm = (r as any).customerCountDkm ?? 0;
    const prevKhDkm = (prevYearTeamMap[r.teamId] as any)?.customerCountDkm ?? 0;
    const dkm = DKM_SVC_KEYS.reduce((s, sk) => s + ((r as any)[sk.key] ?? 0), 0);
    const prevDkm = DKM_SVC_KEYS.reduce((s, sk) => s + ((prevYearTeamMap[r.teamId] as any)?.[sk.key] ?? 0), 0);
    const avgDkm = khDkm > 0 ? dkm / khDkm : 0;
    const prevAvgDkm = prevKhDkm > 0 ? prevDkm / prevKhDkm : 0;
    const khDkmYoy  = (khDkm > 0 && prevKhDkm > 0)      ? ((proj(khDkm)    - prevKhDkm)    / prevKhDkm    * 100) : null;
    const dkmYoy    = (dkm > 0 && prevDkm > 0)           ? ((proj(dkm)     - prevDkm)      / prevDkm      * 100) : null;
    const avgDkmYoy = (avgDkm > 0 && prevAvgDkm > 0)     ? ((avgDkm  - prevAvgDkm)   / prevAvgDkm   * 100) : null;
    const tlKhDkm   = (khDkm > 0 && r.kh > 0)           ? (khDkm / r.kh * 100)                                   : null;
    const tlAvgDkm  = (avgDkm > 0 && r.avgDs > 0)        ? (avgDkm / r.avgDs * 100)                               : null;
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
    const khDkmYoy  = (khDkm > 0 && prevKhDkm > 0)      ? ((proj(khDkm)   - prevKhDkm)   / prevKhDkm   * 100) : null;
    const dkmYoy    = (dkm > 0 && prevDkm > 0)           ? ((proj(dkm)    - prevDkm)     / prevDkm     * 100) : null;
    const avgDkmYoy = (avgDkm > 0 && prevAvgDkm > 0)     ? ((avgDkm - prevAvgDkm)  / prevAvgDkm  * 100) : null;
    const tlKhDkm   = (khDkm > 0 && khTotal > 0)         ? (khDkm / khTotal * 100)                            : null;
    const tlAvgDkm  = (avgDkm > 0 && avgDsTotal > 0)     ? (avgDkm / avgDsTotal * 100)                        : null;
    return { reg, khDkm, dkm, avgDkm, khDkmYoy, dkmYoy, avgDkmYoy, tlKhDkm, tlAvgDkm };
  }).filter(Boolean) as { reg: string; khDkm: number; dkm: number; avgDkm: number; khDkmYoy: number|null; dkmYoy: number|null; avgDkmYoy: number|null; tlKhDkm: number|null; tlAvgDkm: number|null; }[];

  function YoyBadge({ val }: { val: number | null }) {
    if (val === null) return null;
    return (
      <div className={`text-[11px] font-medium mt-0.5 ${val >= 0 ? "text-green-400" : "text-red-400"}`}>
        {val >= 0 ? "▲" : "▼"}{Math.abs(val).toFixed(1)}%
      </div>
    );
  }

  return (
    <div>
      <Header title="Báo Cáo Khách Hàng" />
      <div className="p-6 space-y-5">

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex rounded-lg overflow-hidden border border-slate-700">
            <button onClick={() => setView("month")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === "month" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-700"}`}
            >Tháng</button>
            <button onClick={() => setView("quarter")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === "quarter" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-700"}`}
            >Quý</button>
          </div>

          <div className="relative">
            <button
              onClick={() => setOpenDropdown(openDropdown === (view === "month" ? "month" : "quarter") ? null : (view === "month" ? "month" : "quarter"))}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white hover:bg-slate-700 transition-colors"
            >
              {view === "month" ? selectedMonth : `Q${selectedQuarter}`}
              <span className="text-slate-400">▼</span>
            </button>
            {openDropdown === (view === "month" ? "month" : "quarter") && (
              <div className="absolute top-full mt-1 left-0 z-20 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 min-w-[80px]">
                {view === "month"
                  ? months.map(m => (
                      <button key={m} onClick={() => { setSelectedMonth(m); setOpenDropdown(null); }}
                        className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-700 ${selectedMonth === m ? "text-blue-400 font-semibold" : "text-slate-300"}`}
                      >{m}</button>
                    ))
                  : [1,2,3,4].map(q => (
                      <button key={q} onClick={() => { setSelectedQuarter(q); setOpenDropdown(null); }}
                        className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-700 ${selectedQuarter === q ? "text-blue-400 font-semibold" : "text-slate-300"}`}
                      >Q{q}</button>
                    ))
                }
              </div>
            )}
          </div>

          <div className="flex rounded-lg overflow-hidden border border-slate-700">
            {(["all","HN","HCM"] as const).map(r => (
              <button key={r} onClick={() => setRegion(r)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${region === r ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-700"}`}
              >{r === "all" ? "Tất cả" : r}</button>
            ))}
          </div>
        </div>

        {!hasKhData && (
          <Card>
            <CardContent className="py-12 text-center text-slate-400 text-sm">
              Chưa có dữ liệu khách hàng cho kỳ này. Vui lòng nhập số liệu tại trang <strong className="text-white">Nhập Dữ Liệu</strong>.
            </CardContent>
          </Card>
        )}

        {/* Bảng 1: Báo Cáo Khách Hàng */}
        {hasKhData && (
          <Card className="mb-4">
            <CardHeader className="flex-col items-start gap-1">
              <div className="flex items-center justify-between gap-3 w-full">
                <CardTitle className="text-sm font-semibold text-slate-200">
                  Báo Cáo Khách Hàng — {filterLabel}
                </CardTitle>
                <MiniAiPanel context="kh_report" label="AI nhận xét" data={{
                  period: filterLabel, region,
                  rows: rows.map(r => ({ name: r.teamName, region: r.region, kh: r.kh, ds: r.ds, avgDs: r.avgDs }))
                }} />
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <span>Tổng Số KH · DS (triệu VNĐ) · TB DS/KH</span>
                {hasPrevKhData && <span className="text-amber-400">▲/▼ so cùng kỳ 2025</span>}
                {paceLabel && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300">
                    ⏱ Pace {paceLabel} — YoY theo tốc độ dự kiến
                  </span>
                )}
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
        )}

        {/* Bảng 2: TB DS ĐKM / KH */}
        {hasKhData && hasDkmKhData && (
          <Card className="mb-4">
            <CardHeader className="flex-col items-start gap-1">
              <CardTitle className="text-sm font-semibold text-slate-200">
                TB Doanh Số Đăng Ký Mới / Khách Hàng — {filterLabel}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <span>KH ĐKM · DS ĐKM (triệu VNĐ) · TB DS ĐKM/KH</span>
                {hasPrevKhData && <span className="text-amber-400">▲/▼ so cùng kỳ 2025</span>}
                {paceLabel && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300">
                    ⏱ Pace {paceLabel}
                  </span>
                )}
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
                          <div className="text-sm font-bold text-amber-300">{s.tlKhDkm != null ? `${s.tlKhDkm.toFixed(1)}%` : "—"}</div>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <div className="text-sm font-bold text-rose-300">{s.tlAvgDkm != null ? `${s.tlAvgDkm.toFixed(1)}%` : "—"}</div>
                        </td>
                      </tr>
                    );
                  })}
                </tfoot>
              </table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
