"use client";

import { useState, useEffect, useCallback } from "react";
import { Header, PageHeader } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CheckCircle2, Loader2, Save, RefreshCw } from "lucide-react";
import { MONTHLY_DATA, REVENUE_TYPE, TEAM_SERVICE_DATA } from "@/lib/mock-data";
import type { TeamServiceRecord, TeamMonthlyData } from "@/lib/types";

type Tab = "monthly" | "revenue" | "team";

function NumInput({
  value, onChange, className = "",
}: { value: number | null; onChange: (v: number | null) => void; className?: string }) {
  return (
    <input
      type="number"
      step="0.001"
      value={value ?? ""}
      placeholder="—"
      onChange={(e) => onChange(e.target.value === "" ? null : parseFloat(e.target.value))}
      className={`w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white text-right focus:outline-none focus:border-blue-500 ${className}`}
    />
  );
}

export function ImportClient({ userEmail }: { userEmail: string }) {
  const [tab, setTab] = useState<Tab>("monthly");
  const [monthlyData, setMonthlyData] = useState<typeof MONTHLY_DATA>([...MONTHLY_DATA]);
  const [revenueData, setRevenueData] = useState<typeof REVENUE_TYPE>([...REVENUE_TYPE]);
  const [teamData, setTeamData] = useState<TeamMonthlyData>(TEAM_SERVICE_DATA.map(m => ({ ...m, teams: m.teams.map(t => ({ ...t })) })));
  const [teamPrevData, setTeamPrevData] = useState<TeamMonthlyData>(TEAM_SERVICE_DATA.map(m => ({ ...m, teams: m.teams.map(t => ({ ...t, revenue: 0, target: 0, customerCount: 0, hostMail: 0, msgws: 0, tenMien: 0, transferGws: 0, saleAi: 0, elastic: 0 })) })));
  const [teamMonth, setTeamMonth] = useState(`T${new Date().getMonth() + 1}`);
  const [teamYear, setTeamYear] = useState<"2026" | "prev">("2026");
  const [revenueYear, setRevenueYear] = useState<"2026" | "prev">("2026");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [r1, r2, r4, r5] = await Promise.all([
        fetch("/api/data?key=monthly_data").then(r => r.json()),
        fetch("/api/data?key=revenue_type").then(r => r.json()),
        fetch("/api/data?key=team_service").then(r => r.json()),
        fetch("/api/data?key=team_service_prev").then(r => r.json()),
      ]);
      if (r1.data) setMonthlyData(r1.data);
      if (r2.data) setRevenueData(r2.data);
      let currentTeamData: TeamMonthlyData = TEAM_SERVICE_DATA;
      if (r4.data) {
        if (Array.isArray(r4.data) && r4.data.length > 0 && !("month" in r4.data[0])) {
          const oldTeams = r4.data as TeamServiceRecord[];
          currentTeamData = TEAM_SERVICE_DATA.map(m => ({
            ...m,
            teams: oldTeams.map(t => ({ ...t, revenue: 0, target: 0, customerCount: 0, hostMail: 0, msgws: 0, tenMien: 0, transferGws: 0, saleAi: 0, elastic: 0 })),
          }));
        } else {
          currentTeamData = r4.data as TeamMonthlyData;
        }
        setTeamData(currentTeamData);
      }

      // Sync teamPrevData theo cùng cấu trúc teamId/thứ tự với teamData 2026
      const prevRaw: TeamMonthlyData | null =
        r5.data && Array.isArray(r5.data) && r5.data.length > 0 && "month" in r5.data[0]
          ? r5.data as TeamMonthlyData
          : null;
      const syncedPrev: TeamMonthlyData = currentTeamData.map(({ month, teams }) => {
        const prevMonth = prevRaw?.find(m => m.month === month);
        return {
          month,
          teams: teams.map(ct => {
            const pt = prevMonth?.teams.find(t => t.teamId === ct.teamId);
            return pt
              ? { ...pt, teamName: ct.teamName, region: ct.region }
              : { ...ct, revenue: 0, target: 0, customerCount: 0, hostMail: 0, msgws: 0, tenMien: 0, transferGws: 0, saleAi: 0, elastic: 0 };
          }),
        };
      });
      setTeamPrevData(syncedPrev);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Tự đồng bộ HN/HCM trong monthlyData từ revenueData (HN = dkHn+ghHn, HCM = dkHcm+ghHcm)
  useEffect(() => {
    setMonthlyData(prev => prev.map(row => {
      const rev = revenueData.find(r => r.month === row.month);
      if (!rev) return row;
      const hn  = ((rev as any).dkHn  ?? 0) + ((rev as any).ghHn  ?? 0);
      const hcm = ((rev as any).dkHcm ?? 0) + ((rev as any).ghHcm ?? 0);
      return { ...row, hn, hcm };
    }));
  }, [revenueData]);

  async function save() {
    setSaving(true);
    try {
      const keyMap: Record<Tab, { key: string; data: any }> = {
        monthly: { key: "monthly_data",    data: monthlyData },
        revenue: { key: "revenue_type",    data: revenueData },
        team:    { key: teamYear === "prev" ? "team_service_prev" : "team_service", data: teamYear === "prev" ? teamPrevData : teamData },
      };
      const { key, data } = keyMap[tab];
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, data }),
      });
      if (!res.ok) throw new Error("Lỗi lưu dữ liệu");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: "monthly", label: "Doanh Số Tháng" },
    { key: "revenue", label: "ĐK Mới & Gia Hạn" },
    { key: "team",    label: "Doanh Số Team" },
  ];

  return (
    <div>
      <Header title="Nhập Dữ Liệu" />
      <div className="p-6">
        <PageHeader title="Nhập Dữ Liệu Trực Tiếp" subtitle="Chỉnh sửa số liệu và bấm Lưu để cập nhật Dashboard ngay lập tức">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={loadData} disabled={loading}>
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Tải lại
            </Button>
            <Button variant="primary" size="sm" onClick={save} disabled={saving || loading}>
              {saving ? <Loader2 size={13} className="animate-spin" /> : saved ? <CheckCircle2 size={13} className="text-green-400" /> : <Save size={13} />}
              {saved ? "Đã lưu!" : "Lưu dữ liệu"}
            </Button>
          </div>
        </PageHeader>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-slate-800/50 p-1 rounded-xl w-fit">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500 gap-2">
            <Loader2 size={16} className="animate-spin" /> Đang tải dữ liệu...
          </div>
        ) : (
          <Card>
            <CardContent className="pt-4 overflow-x-auto">

              {/* Tab 1: Doanh Số Tháng */}
              {tab === "monthly" && (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-2 px-3 text-slate-400 font-medium w-12">Tháng</th>
                      <th className="text-right py-2 px-2 text-sky-400 font-medium">HN (tỷ) <span className="text-[10px] opacity-50">(tự tính)</span></th>
                      <th className="text-right py-2 px-2 text-sky-400 font-medium">HCM (tỷ) <span className="text-[10px] opacity-50">(tự tính)</span></th>
                      <th className="text-right py-2 px-2 text-slate-400 font-medium">Cùng kỳ 2025</th>
                      <th className="text-right py-2 px-2 text-blue-400/70 font-medium">HN 2025 (tỷ)</th>
                      <th className="text-right py-2 px-2 text-orange-400/70 font-medium">HCM 2025 (tỷ)</th>
                      <th className="text-right py-2 px-2 text-slate-400 font-medium">MT 8% (tỷ)</th>
                      <th className="text-right py-2 px-2 text-slate-400 font-medium">MT 10% (tỷ)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyData.map((row, i) => (
                      <tr key={row.month} className="border-b border-slate-800 hover:bg-slate-800/30">
                        <td className="py-1.5 px-3 text-slate-300 font-semibold">{row.month}</td>
                        <td className="py-1 px-2">
                          <div className="w-full bg-slate-800/60 border border-slate-600/40 rounded px-2 py-1 text-right text-sky-300 font-semibold">
                            {(row.hn ?? 0).toLocaleString()}
                          </div>
                        </td>
                        <td className="py-1 px-2">
                          <div className="w-full bg-slate-800/60 border border-slate-600/40 rounded px-2 py-1 text-right text-sky-300 font-semibold">
                            {(row.hcm ?? 0).toLocaleString()}
                          </div>
                        </td>
                        <td className="py-1 px-2"><NumInput value={row.cumKy} onChange={v => setMonthlyData(d => d.map((r, j) => j === i ? { ...r, cumKy: v ?? 0 } : r))} /></td>
                        <td className="py-1 px-2"><NumInput value={(row as any).hnPrev ?? null} onChange={v => setMonthlyData(d => d.map((r, j) => j === i ? { ...r, hnPrev: v } as any : r))} /></td>
                        <td className="py-1 px-2"><NumInput value={(row as any).hcmPrev ?? null} onChange={v => setMonthlyData(d => d.map((r, j) => j === i ? { ...r, hcmPrev: v } as any : r))} /></td>
                        <td className="py-1 px-2"><NumInput value={row.mt8} onChange={v => setMonthlyData(d => d.map((r, j) => j === i ? { ...r, mt8: v ?? 0 } : r))} /></td>
                        <td className="py-1 px-2"><NumInput value={row.mt10} onChange={v => setMonthlyData(d => d.map((r, j) => j === i ? { ...r, mt10: v ?? 0 } : r))} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Tab 2: ĐK Mới & Gia Hạn */}
              {tab === "revenue" && (() => {
                const is2026 = revenueYear === "2026";
                // Columns config: [field, label, color, isTotal]
                type ColCfg = { field: string; label: string; color: string; isTotal?: boolean };
                const cols2026: ColCfg[] = [
                  { field: "dangKyMoi", label: "ĐK Mới",  color: "text-sky-400",    isTotal: true },
                  { field: "dkHn",      label: "ĐK HN",   color: "text-sky-300" },
                  { field: "dkHcm",     label: "ĐK HCM",  color: "text-sky-300" },
                  { field: "giaHan",    label: "Gia Hạn", color: "text-purple-400", isTotal: true },
                  { field: "ghHn",      label: "GH HN",   color: "text-purple-300" },
                  { field: "ghHcm",     label: "GH HCM",  color: "text-purple-300" },
                ];
                const colsPrev: ColCfg[] = [
                  { field: "prev_dk",    label: "ĐK Mới 2025",  color: "text-amber-400",  isTotal: true },
                  { field: "prev_dkHn",  label: "ĐK HN 2025",   color: "text-amber-300" },
                  { field: "prev_dkHcm", label: "ĐK HCM 2025",  color: "text-amber-300" },
                  { field: "prev_gh",    label: "Gia Hạn 2025",  color: "text-orange-400", isTotal: true },
                  { field: "prev_ghHn",  label: "GH HN 2025",   color: "text-orange-300" },
                  { field: "prev_ghHcm", label: "GH HCM 2025",  color: "text-orange-300" },
                ];
                const cols = is2026 ? cols2026 : colsPrev;

                // Auto-compute totals when HN/HCM sub-fields change
                const handleRevenueChange = (rowIdx: number, field: string, v: number | null) => {
                  setRevenueData(d => d.map((r, j) => {
                    if (j !== rowIdx) return r;
                    const updated = { ...r, [field]: v ?? 0 };
                    // recompute totals
                    updated.dangKyMoi = (updated.dkHn ?? 0) + (updated.dkHcm ?? 0);
                    updated.giaHan    = (updated.ghHn ?? 0) + (updated.ghHcm ?? 0);
                    (updated as any).prev_dk = ((updated as any).prev_dkHn ?? 0) + ((updated as any).prev_dkHcm ?? 0);
                    (updated as any).prev_gh = ((updated as any).prev_ghHn ?? 0) + ((updated as any).prev_ghHcm ?? 0);
                    return updated;
                  }));
                };

                return (
                  <div className="space-y-3">
                    {/* Toggle năm */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Năm nhập:</span>
                      <div className="flex bg-slate-800 rounded-lg p-0.5 gap-0.5">
                        <button onClick={() => setRevenueYear("2026")}
                          className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${is2026 ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}>
                          2026
                        </button>
                        <button onClick={() => setRevenueYear("prev")}
                          className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${!is2026 ? "bg-amber-600 text-white" : "text-amber-400/70 hover:text-amber-300"}`}>
                          CK 2025
                        </button>
                      </div>
                      {!is2026 && <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/30">Nhập ĐK Mới & Gia Hạn năm 2025 để tính tăng trưởng</span>}
                    </div>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="text-left py-2 px-3 text-slate-400 font-medium w-12">Tháng</th>
                          {cols.map(c => (
                            <th key={c.field} className={`text-right py-2 px-2 ${c.color} font-medium`}>
                              {c.label}{c.isTotal && <span className="ml-1 text-[10px] opacity-50">(tự tính)</span>}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {revenueData.map((row, i) => (
                          <tr key={row.month} className={`border-b border-slate-800 hover:bg-slate-800/30 ${!is2026 ? "bg-amber-950/10" : ""}`}>
                            <td className="py-1.5 px-3 text-slate-300 font-semibold">{row.month}</td>
                            {cols.map(c => (
                              <td key={c.field} className="py-1 px-2">
                                {c.isTotal ? (
                                  <div className="w-full bg-slate-800/60 border border-slate-600/40 rounded px-2 py-1 text-right text-slate-300 font-semibold">
                                    {((row as any)[c.field] ?? 0).toLocaleString()}
                                  </div>
                                ) : (
                                  <NumInput value={(row as any)[c.field] ?? 0} onChange={v => handleRevenueChange(i, c.field, v)} />
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}

              {/* Tab 3: Doanh Số Team */}
              {tab === "team" && (() => {
                const SVC_FIELDS = ["revenue","target","hostMail","msgws","tenMien","transferGws","saleAi","elastic"] as const;
                const QUARTER_MAP: Record<string, string[]> = {
                  Q1: ["T1","T2","T3"], Q2: ["T4","T5","T6"], Q3: ["T7","T8","T9"], Q4: ["T10","T11","T12"],
                };
                const isQuarter = teamMonth.startsWith("Q");

                const isPrev = teamYear === "prev";
                // teamPrevData đã được sync cùng cấu trúc với teamData từ loadData
                const displayData = isPrev ? teamPrevData : teamData;
                const setActiveData = isPrev ? setTeamPrevData : setTeamData;

                const currentTeams = (() => {
                  if (!isQuarter) return displayData.find(m => m.month === teamMonth)?.teams ?? [];
                  const months = QUARTER_MAP[teamMonth];
                  const monthDatas = months.map(m => displayData.find(d => d.month === m)?.teams ?? []);
                  const baseTeams = monthDatas[0] ?? [];
                  return baseTeams.map((t, i) => ({
                    ...t,
                    ...Object.fromEntries(SVC_FIELDS.map(f => [f, months.reduce((s, _, mi) => s + ((monthDatas[mi][i] as any)?.[f] ?? 0), 0)])),
                  }));
                })();

                // Totals row
                const totals = Object.fromEntries(SVC_FIELDS.map(f => [f, currentTeams.reduce((s, t) => s + ((t as any)[f] ?? 0), 0)]));
                const hnTotals = Object.fromEntries(SVC_FIELDS.map(f => [f, currentTeams.filter(t => t.region === "HN").reduce((s, t) => s + ((t as any)[f] ?? 0), 0)]));
                const hcmTotals = Object.fromEntries(SVC_FIELDS.map(f => [f, currentTeams.filter(t => t.region === "HCM").reduce((s, t) => s + ((t as any)[f] ?? 0), 0)]));

                const addTeam = () => {
                  if (isPrev) return;
                  const newTeam: TeamServiceRecord = { teamId: `team_${Date.now()}`, teamName: "Team mới", region: "HN", revenue: 0, target: 0, customerCount: 0, hostMail: 0, msgws: 0, tenMien: 0, transferGws: 0, saleAi: 0, elastic: 0 };
                  setTeamData(d => d.map(m => ({ ...m, teams: [...m.teams, { ...newTeam }] })));
                };

                const deleteTeam = (teamId: string) => {
                  if (isPrev) return;
                  setTeamData(d => d.map(m => ({ ...m, teams: m.teams.filter(t => t.teamId !== teamId) })));
                };

                const updateName = (teamId: string, val: string) => {
                  if (isPrev) return;
                  setTeamData(d => d.map(m => ({ ...m, teams: m.teams.map(t => t.teamId === teamId ? { ...t, teamName: val } : t) })));
                };

                const updateRegion = (teamId: string, val: "HN" | "HCM") => {
                  if (isPrev) return;
                  setTeamData(d => d.map(m => ({ ...m, teams: m.teams.map(t => t.teamId === teamId ? { ...t, region: val } : t) })));
                };

                const updateField = (i: number, field: string, v: number | null) => {
                  setActiveData(d => d.map(m => m.month === teamMonth
                    ? { ...m, teams: m.teams.map((r, j) => j === i ? { ...r, [field]: v ?? 0 } : r) }
                    : m
                  ));
                };

                return (
                  <div className="space-y-3">
                    {/* Toggle năm */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Năm nhập:</span>
                      <div className="flex bg-slate-800 rounded-lg p-0.5 gap-0.5">
                        <button onClick={() => setTeamYear("2026")}
                          className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${teamYear === "2026" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}>
                          2026
                        </button>
                        <button onClick={() => setTeamYear("prev")}
                          className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${teamYear === "prev" ? "bg-amber-600 text-white" : "text-amber-400/70 hover:text-amber-300"}`}>
                          CK 2025
                        </button>
                      </div>
                      {isPrev && <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/30">Nhập số liệu cùng kỳ 2025 để so sánh tăng trưởng</span>}
                    </div>

                    {/* Tabs tháng + quý */}
                    <div className="flex flex-wrap gap-1 items-center">
                      <span className="text-xs text-slate-500 mr-1">Tháng:</span>
                      {Array.from({ length: 12 }, (_, i) => `T${i + 1}`).map(m => (
                        <button key={m} onClick={() => setTeamMonth(m)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${teamMonth === m ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}>
                          {m}
                        </button>
                      ))}
                      <span className="text-xs text-slate-500 ml-3 mr-1">Quý:</span>
                      {["Q1","Q2","Q3","Q4"].map(q => (
                        <button key={q} onClick={() => setTeamMonth(q)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${teamMonth === q ? "bg-purple-600 text-white" : "bg-slate-800 text-purple-400 hover:text-white"}`}>
                          {q}
                        </button>
                      ))}
                      {!isQuarter && !isPrev && (
                        <button onClick={addTeam}
                          className="ml-auto text-xs text-blue-400 hover:text-blue-300 px-3 py-1 rounded-lg border border-blue-500/30 hover:bg-blue-500/10 transition-colors">
                          + Thêm Team
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-slate-500">
                      {isQuarter
                        ? `Xem tổng hợp ${teamMonth} (${QUARTER_MAP[teamMonth].join("+")}) — chỉ đọc, nhập số liệu ở từng tháng`
                        : isPrev
                          ? "Nhập doanh số từng nhóm dịch vụ của năm 2025 để so sánh tăng trưởng · Tên team & vùng lấy theo danh sách 2026"
                          : "Tên team & vùng áp dụng cho tất cả tháng · Doanh số nhập riêng từng tháng · Cùng kỳ 2025 nhập ở tab Doanh Số Tháng"}
                    </p>

                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="text-left py-2 px-3 text-slate-400 sticky left-0 z-10 bg-slate-900">Tên Team</th>
                          <th className="text-center py-2 px-2 text-slate-400">Vùng</th>
                          <th className="text-right py-2 px-2 text-slate-400">Tổng DS</th>
                          <th className="text-right py-2 px-2 text-slate-400">Mục tiêu</th>
                          <th className="text-right py-2 px-2 text-teal-400">Số KH</th>
                          <th className="text-right py-2 px-2 text-blue-400">Host/Mail</th>
                          <th className="text-right py-2 px-2 text-green-400">MS/GWS</th>
                          <th className="text-right py-2 px-2 text-amber-400">Tên miền</th>
                          <th className="text-right py-2 px-2 text-purple-400">Transfer</th>
                          <th className="text-right py-2 px-2 text-red-400">Sale AI</th>
                          <th className="text-right py-2 px-2 text-cyan-400">Elastic</th>
                          {!isQuarter && !isPrev && <th className="py-2 px-2"></th>}
                        </tr>
                      </thead>
                      <tbody>
                        {currentTeams.map((row, i) => (
                          <tr key={row.teamId} className={`border-b border-slate-800 hover:bg-slate-800/30 ${isPrev ? "bg-amber-950/10" : ""}`}>
                            <td className={`py-1 px-3 sticky left-0 z-10 ${isPrev ? "bg-amber-950/20" : "bg-slate-900"}`}>
                              {isQuarter || isPrev
                                ? <span className="text-slate-200">{row.teamName}</span>
                                : <input value={row.teamName} onChange={e => updateName(row.teamId, e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500" />}
                            </td>
                            <td className="py-1 px-2 text-center">
                              <span className={row.region === "HN" ? "text-blue-400" : "text-orange-400"}>{row.region}</span>
                            </td>
                            {SVC_FIELDS.map(field => {
                              // Insert Số KH column after "target"
                              const khCell = field === "hostMail" ? (
                                <td key="customerCount" className="py-1 px-2">
                                  {isQuarter
                                    ? <span className="block text-right text-teal-300 tabular-nums pr-2">{row.customerCount ?? 0}</span>
                                    : <NumInput value={row.customerCount ?? 0} onChange={v => updateField(i, "customerCount", v)} />}
                                </td>
                              ) : null;
                              return (
                                <>
                                  {khCell}
                                  <td key={field} className="py-1 px-2">
                                    {isQuarter
                                      ? <span className="block text-right text-slate-300 tabular-nums pr-2">{((row as any)[field] ?? 0).toFixed(1)}</span>
                                      : <NumInput value={(row as any)[field]} onChange={v => updateField(i, field, v)} />}
                                  </td>
                                </>
                              );
                            })}
                            {!isQuarter && !isPrev && (
                              <td className="py-1 px-2">
                                <button onClick={() => deleteTeam(row.teamId)} className="text-slate-600 hover:text-red-400 transition-colors">✕</button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-blue-500/40 bg-blue-900/20">
                          <td className="py-2 px-3 font-bold text-blue-300 sticky left-0 z-10 bg-blue-900/60">HN</td>
                          <td className="py-2 px-2 text-center text-blue-400 text-xs">—</td>
                          {SVC_FIELDS.map(f => (<>
                            {f === "hostMail" && <td key="kh-hn" className="py-2 px-2 text-right font-semibold text-teal-300 tabular-nums">{currentTeams.filter(t=>t.region==="HN").reduce((s,t)=>s+(t.customerCount??0),0)}</td>}
                            <td key={f} className="py-2 px-2 text-right font-semibold text-blue-300 tabular-nums">{(hnTotals[f] as number).toFixed(1)}</td>
                          </>))}
                          {!isQuarter && !isPrev && <td />}
                        </tr>
                        <tr className="border-t border-orange-500/40 bg-orange-900/20">
                          <td className="py-2 px-3 font-bold text-orange-300 sticky left-0 z-10 bg-orange-900/60">HCM</td>
                          <td className="py-2 px-2 text-center text-orange-400 text-xs">—</td>
                          {SVC_FIELDS.map(f => (<>
                            {f === "hostMail" && <td key="kh-hcm" className="py-2 px-2 text-right font-semibold text-teal-300 tabular-nums">{currentTeams.filter(t=>t.region==="HCM").reduce((s,t)=>s+(t.customerCount??0),0)}</td>}
                            <td key={f} className="py-2 px-2 text-right font-semibold text-orange-300 tabular-nums">{(hcmTotals[f] as number).toFixed(1)}</td>
                          </>))}
                          {!isQuarter && !isPrev && <td />}
                        </tr>
                        <tr className="border-t-2 border-slate-500 bg-slate-700/40">
                          <td className="py-2.5 px-3 font-bold text-white text-sm sticky left-0 z-10 bg-slate-700/80">TỔNG</td>
                          <td className="py-2 px-2 text-center text-slate-400 text-xs">—</td>
                          {SVC_FIELDS.map(f => (<>
                            {f === "hostMail" && <td key="kh-total" className="py-2.5 px-2 text-right font-bold text-teal-300 tabular-nums">{currentTeams.reduce((s,t)=>s+(t.customerCount??0),0)}</td>}
                            <td key={f} className="py-2.5 px-2 text-right font-bold text-white tabular-nums">{(totals[f] as number).toFixed(1)}</td>
                          </>))}
                          {!isQuarter && !isPrev && <td />}
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                );
              })()}

            </CardContent>
          </Card>
        )}

        <p className="text-xs text-slate-500 mt-3">Đơn vị: <strong className="text-slate-400">Tỷ VNĐ</strong> cho Doanh Số Tháng & ĐK/GH · <strong className="text-slate-400">Triệu VNĐ</strong> cho Dịch Vụ & Doanh Số Team · Sau khi lưu, Dashboard cập nhật ngay khi reload trang.</p>
      </div>
    </div>
  );
}
