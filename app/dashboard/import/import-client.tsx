"use client";

import { useState, useEffect, useCallback } from "react";
import { Header, PageHeader } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CheckCircle2, Loader2, Save, RefreshCw } from "lucide-react";
import { MONTHLY_DATA, REVENUE_TYPE, SERVICE_MONTHLY } from "@/lib/mock-data";

type Tab = "monthly" | "revenue" | "service";

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
      if (r1.data) setMonthlyData(r1.data);
      if (r2.data) setRevenueData(r2.data);
      if (r3.data) setServiceData(r3.data);
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

            </CardContent>
          </Card>
        )}

        <p className="text-xs text-slate-500 mt-3">Đơn vị: tỷ VNĐ cho Doanh Số Tháng & ĐK/GH · Triệu VNĐ cho Dịch Vụ · Sau khi lưu, Dashboard cập nhật ngay khi reload trang.</p>
      </div>
    </div>
  );
}
