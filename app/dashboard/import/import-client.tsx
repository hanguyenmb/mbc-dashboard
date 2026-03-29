"use client";

import { useState, useEffect, useCallback } from "react";
import { Header, PageHeader } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CheckCircle2, Loader2, Save, RefreshCw } from "lucide-react";
import { MONTHLY_DATA, REVENUE_TYPE, SERVICE_MONTHLY, TEAM_SERVICE_DATA } from "@/lib/mock-data";
import type { TeamServiceRecord } from "@/lib/types";

type Tab = "monthly" | "revenue" | "service" | "team";

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
  const [serviceData, setServiceData] = useState<typeof SERVICE_MONTHLY>([...SERVICE_MONTHLY]);
  const [teamData, setTeamData] = useState<TeamServiceRecord[]>([...TEAM_SERVICE_DATA]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [r1, r2, r3] = await Promise.all([
        fetch("/api/data?key=monthly_data").then(r => r.json()),
        fetch("/api/data?key=revenue_type").then(r => r.json()),
        fetch("/api/data?key=service_monthly").then(r => r.json()),
      ]);
      const r4 = await fetch("/api/data?key=team_service").then(r => r.json());
      if (r1.data) setMonthlyData(r1.data);
      if (r2.data) setRevenueData(r2.data);
      if (r3.data) setServiceData(r3.data);
      if (r4.data) setTeamData(r4.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function save() {
    setSaving(true);
    try {
      const keyMap: Record<Tab, { key: string; data: any }> = {
        monthly: { key: "monthly_data",    data: monthlyData },
        revenue: { key: "revenue_type",    data: revenueData },
        service: { key: "service_monthly", data: serviceData },
        team:    { key: "team_service",    data: teamData },
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
    { key: "service", label: "Dịch Vụ" },
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
                      <th className="text-right py-2 px-2 text-slate-400 font-medium">HN (tỷ)</th>
                      <th className="text-right py-2 px-2 text-slate-400 font-medium">HCM (tỷ)</th>
                      <th className="text-right py-2 px-2 text-slate-400 font-medium">Cùng kỳ 2025</th>
                      <th className="text-right py-2 px-2 text-slate-400 font-medium">MT 8% (tỷ)</th>
                      <th className="text-right py-2 px-2 text-slate-400 font-medium">MT 10% (tỷ)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyData.map((row, i) => (
                      <tr key={row.month} className="border-b border-slate-800 hover:bg-slate-800/30">
                        <td className="py-1.5 px-3 text-slate-300 font-semibold">{row.month}</td>
                        <td className="py-1 px-2"><NumInput value={row.hn ?? null} onChange={v => setMonthlyData(d => d.map((r, j) => j === i ? { ...r, hn: v } : r))} /></td>
                        <td className="py-1 px-2"><NumInput value={row.hcm ?? null} onChange={v => setMonthlyData(d => d.map((r, j) => j === i ? { ...r, hcm: v } : r))} /></td>
                        <td className="py-1 px-2"><NumInput value={row.cumKy} onChange={v => setMonthlyData(d => d.map((r, j) => j === i ? { ...r, cumKy: v ?? 0 } : r))} /></td>
                        <td className="py-1 px-2"><NumInput value={row.mt8} onChange={v => setMonthlyData(d => d.map((r, j) => j === i ? { ...r, mt8: v ?? 0 } : r))} /></td>
                        <td className="py-1 px-2"><NumInput value={row.mt10} onChange={v => setMonthlyData(d => d.map((r, j) => j === i ? { ...r, mt10: v ?? 0 } : r))} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Tab 2: ĐK Mới & Gia Hạn */}
              {tab === "revenue" && (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-2 px-3 text-slate-400 font-medium w-12">Tháng</th>
                      <th className="text-right py-2 px-2 text-sky-400 font-medium">ĐK Mới</th>
                      <th className="text-right py-2 px-2 text-sky-300 font-medium">ĐK HN</th>
                      <th className="text-right py-2 px-2 text-sky-300 font-medium">ĐK HCM</th>
                      <th className="text-right py-2 px-2 text-purple-400 font-medium">Gia Hạn</th>
                      <th className="text-right py-2 px-2 text-purple-300 font-medium">GH HN</th>
                      <th className="text-right py-2 px-2 text-purple-300 font-medium">GH HCM</th>
                      <th className="text-right py-2 px-2 text-slate-400 font-medium">2025 ĐK</th>
                      <th className="text-right py-2 px-2 text-slate-400 font-medium">2025 GH</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenueData.map((row, i) => (
                      <tr key={row.month} className="border-b border-slate-800 hover:bg-slate-800/30">
                        <td className="py-1.5 px-3 text-slate-300 font-semibold">{row.month}</td>
                        {(["dangKyMoi","dkHn","dkHcm","giaHan","ghHn","ghHcm","prev_dk","prev_gh"] as const).map(field => (
                          <td key={field} className="py-1 px-2">
                            <NumInput value={(row as any)[field]} onChange={v => setRevenueData(d => d.map((r, j) => j === i ? { ...r, [field]: v ?? 0 } : r))} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Tab 3: Dịch Vụ */}
              {tab === "service" && (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-2 px-3 text-slate-400 font-medium w-12">Tháng</th>
                      <th className="text-right py-2 px-2 text-slate-400 font-medium">Host/Mail</th>
                      <th className="text-right py-2 px-2 text-slate-400 font-medium">MS/GWS</th>
                      <th className="text-right py-2 px-2 text-slate-400 font-medium">Tên miền</th>
                      <th className="text-right py-2 px-2 text-slate-400 font-medium">Transfer</th>
                      <th className="text-right py-2 px-2 text-slate-400 font-medium">Sale AI</th>
                      <th className="text-right py-2 px-2 text-slate-400 font-medium">Elastic</th>
                    </tr>
                  </thead>
                  <tbody>
                    {serviceData.map((row, i) => (
                      <tr key={row.month} className="border-b border-slate-800 hover:bg-slate-800/30">
                        <td className="py-1.5 px-3 text-slate-300 font-semibold">{row.month}</td>
                        {(["hostMail","msgws","tenMien","transferGws","saleAi","elastic"] as const).map(field => (
                          <td key={field} className="py-1 px-2">
                            <NumInput value={(row as any)[field]} onChange={v => setServiceData(d => d.map((r, j) => j === i ? { ...r, [field]: v ?? 0 } : r))} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Tab 4: Doanh Số Team */}
              {tab === "team" && (
                <div className="space-y-4">
                  {/* Quản lý danh sách team */}
                  <div className="flex justify-end">
                    <button onClick={() => setTeamData(d => [...d, { teamId: `team_${Date.now()}`, teamName: "Team mới", region: "HN", revenue: 0, target: 0, hostMail: 0, msgws: 0, tenMien: 0, transferGws: 0, saleAi: 0, elastic: 0 }])}
                      className="text-xs text-blue-400 hover:text-blue-300 px-3 py-1.5 rounded-lg border border-blue-500/30 hover:bg-blue-500/10 transition-colors">
                      + Thêm Team
                    </button>
                  </div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-2 px-3 text-slate-400">Tên Team</th>
                        <th className="text-center py-2 px-2 text-slate-400">Vùng</th>
                        <th className="text-right py-2 px-2 text-slate-400">Tổng DS</th>
                        <th className="text-right py-2 px-2 text-slate-400">Mục tiêu</th>
                        <th className="text-right py-2 px-2 text-blue-400">Host/Mail</th>
                        <th className="text-right py-2 px-2 text-green-400">MS/GWS</th>
                        <th className="text-right py-2 px-2 text-amber-400">Tên miền</th>
                        <th className="text-right py-2 px-2 text-purple-400">Transfer</th>
                        <th className="text-right py-2 px-2 text-red-400">Sale AI</th>
                        <th className="text-right py-2 px-2 text-cyan-400">Elastic</th>
                        <th className="py-2 px-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamData.map((row, i) => (
                        <tr key={row.teamId} className="border-b border-slate-800 hover:bg-slate-800/30">
                          <td className="py-1 px-3">
                            <input value={row.teamName} onChange={e => setTeamData(d => d.map((r, j) => j === i ? { ...r, teamName: e.target.value } : r))}
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500" />
                          </td>
                          <td className="py-1 px-2 text-center">
                            <select value={row.region} onChange={e => setTeamData(d => d.map((r, j) => j === i ? { ...r, region: e.target.value as "HN"|"HCM" } : r))}
                              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500">
                              <option value="HN">HN</option>
                              <option value="HCM">HCM</option>
                            </select>
                          </td>
                          {(["revenue","target","hostMail","msgws","tenMien","transferGws","saleAi","elastic"] as const).map(field => (
                            <td key={field} className="py-1 px-2">
                              <NumInput value={(row as any)[field]} onChange={v => setTeamData(d => d.map((r, j) => j === i ? { ...r, [field]: v ?? 0 } : r))} />
                            </td>
                          ))}
                          <td className="py-1 px-2">
                            <button onClick={() => setTeamData(d => d.filter((_, j) => j !== i))} className="text-slate-600 hover:text-red-400 transition-colors">✕</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </CardContent>
          </Card>
        )}

        <p className="text-xs text-slate-500 mt-3">Đơn vị: tỷ VNĐ cho Doanh Số Tháng & ĐK/GH · Triệu VNĐ cho Dịch Vụ · Sau khi lưu, Dashboard cập nhật ngay khi reload trang.</p>
      </div>
    </div>
  );
}
