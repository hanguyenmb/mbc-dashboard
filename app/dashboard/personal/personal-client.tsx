"use client";

import { useState } from "react";
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { Header, PageHeader } from "@/components/layout/header";
import { KpiCard } from "@/components/layout/kpi-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatVND, getStatusLabel } from "@/lib/utils";
import { TEAM_KPIs } from "@/lib/mock-data";
import { DollarSign, ShoppingCart, Users, Sparkles, Target, Calendar } from "lucide-react";
import { AiAnalysisPanel } from "@/components/ai/ai-analysis-panel";
import type { UserRole } from "@/lib/types";

interface PersonalClientProps {
  userId: string;
  userName: string;
  role: UserRole;
  teamId: string | null;
}

// Mock weekly trend for personal
const WEEKLY_TREND = [
  { week: "T1", revenue: 85, target: 100 },
  { week: "T2", revenue: 92, target: 100 },
  { week: "T3", revenue: 78, target: 100 },
  { week: "T4", revenue: 105, target: 100 },
  { week: "T5", revenue: 118, target: 100 },
  { week: "T6", revenue: 95, target: 100 },
];

export function PersonalClient({ userId, userName, role, teamId }: PersonalClientProps) {
  const [showAI, setShowAI] = useState(false);

  // Find member data
  let memberData = null;
  for (const team of TEAM_KPIs) {
    const m = team.members.find((m) => m.userId === userId);
    if (m) { memberData = { ...m, teamName: team.teamName }; break; }
  }

  // Fallback for manager/leader without personal record
  if (!memberData) {
    const team = TEAM_KPIs.find((t) => t.teamId === teamId);
    if (team) {
      memberData = {
        userId,
        name: userName,
        teamName: team.teamName,
        revenue: team.revenue,
        orders: team.orders,
        customers: team.customers,
        target: team.target,
      };
    }
  }

  if (!memberData) {
    return (
      <div className="p-6 text-slate-400 text-center mt-20">
        Không tìm thấy dữ liệu cá nhân. Vui lòng nhập dữ liệu.
      </div>
    );
  }

  const revPct = Math.round((memberData.revenue / memberData.target.revenue) * 100);
  const orderPct = Math.round((memberData.orders / memberData.target.orders) * 100);
  const custPct = Math.round((memberData.customers / memberData.target.customers) * 100);
  const avgPct = Math.round((revPct + orderPct + custPct) / 3);
  const status = getStatusLabel(avgPct);

  const radialData = [
    { name: "Doanh Số", value: Math.min(revPct, 100), fill: "#0066CC" },
    { name: "Đơn Hàng", value: Math.min(orderPct, 100), fill: "#10B981" },
    { name: "Khách Hàng", value: Math.min(custPct, 100), fill: "#F59E0B" },
  ];

  return (
    <div>
      <Header title="Báo Cáo Cá Nhân">
        <Button variant="primary" size="sm" onClick={() => setShowAI(true)}>
          <Sparkles size={14} /> Trợ Lý AI
        </Button>
      </Header>

      <div className="p-6">
        <PageHeader
          title="Báo Cáo Cá Nhân"
          subtitle={`${memberData.teamName} — Kỳ: Q1/2025`}
        >
          <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${status.bg} ${status.color}`}>
            {status.label}
          </span>
        </PageHeader>

        {/* Top row: radial + KPIs */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          {/* Radial chart */}
          <Card className="flex flex-col items-center justify-center py-4">
            <div className="text-xs text-slate-400 mb-2 font-medium">Hiệu Suất Tổng Thể</div>
            <ResponsiveContainer width="100%" height={160}>
              <RadialBarChart
                cx="50%" cy="50%"
                innerRadius="40%" outerRadius="90%"
                data={radialData}
                startAngle={90} endAngle={-270}
              >
                <RadialBar dataKey="value" cornerRadius={4} background={{ fill: "#1e293b" }} />
                <Tooltip
                  contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#f1f5f9" }}
                  formatter={(v) => [`${v}%`]}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className={`text-2xl font-bold ${status.color}`}>{avgPct}%</div>
            <div className="text-xs text-slate-400 mt-0.5">{status.label}</div>
          </Card>

          {/* KPI cards */}
          <KpiCard
            title="Doanh Số"
            value={formatVND(memberData.revenue)}
            target={formatVND(memberData.target.revenue)}
            percent={revPct}
            icon={DollarSign}
            iconColor="text-green-400"
          />
          <KpiCard
            title="Đơn Hàng"
            value={memberData.orders.toLocaleString()}
            target={memberData.target.orders.toLocaleString()}
            percent={orderPct}
            icon={ShoppingCart}
            iconColor="text-orange-400"
          />
          <KpiCard
            title="Khách Hàng"
            value={memberData.customers.toLocaleString()}
            target={memberData.target.customers.toLocaleString()}
            percent={custPct}
            icon={Users}
            iconColor="text-blue-400"
          />
        </div>

        {/* Trend chart + Milestone */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Xu Hướng Hàng Tuần</CardTitle>
              <Badge variant="neutral">% so với mục tiêu</Badge>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={WEEKLY_TREND}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="week" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#f1f5f9" }}
                    formatter={(v) => [`${v}%`]}
                  />
                  <Line type="monotone" dataKey="target" stroke="#334155" strokeDasharray="4 4" strokeWidth={2} dot={false} name="Mục tiêu" />
                  <Line type="monotone" dataKey="revenue" stroke="#0066CC" strokeWidth={2.5} dot={{ fill: "#0066CC", r: 3 }} name="Thực tế" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Milestone */}
          <Card>
            <CardHeader>
              <CardTitle>Cột Mốc Chỉ Tiêu</CardTitle>
              <Target size={14} className="text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { label: "25% mục tiêu", reached: revPct >= 25, value: "25%" },
                  { label: "50% mục tiêu", reached: revPct >= 50, value: "50%" },
                  { label: "75% mục tiêu", reached: revPct >= 75, value: "75%" },
                  { label: "100% chỉ tiêu", reached: revPct >= 100, value: "100%" },
                  { label: "Vượt 120%", reached: revPct >= 120, value: "120%" },
                ].map((m) => (
                  <div key={m.label} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      m.reached
                        ? "bg-green-500 border-green-500"
                        : "border-slate-600 bg-transparent"
                    }`}>
                      {m.reached && (
                        <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-sm ${m.reached ? "text-white" : "text-slate-500"}`}>{m.label}</span>
                    <span className={`ml-auto text-xs font-medium ${m.reached ? "text-green-400" : "text-slate-600"}`}>{m.value}</span>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <div className="mt-5 pt-4 border-t border-slate-700/50">
                <div className="flex justify-between text-xs text-slate-400 mb-2">
                  <span>Tiến độ doanh số</span>
                  <span className={revPct >= 100 ? "text-green-400" : "text-amber-400"}>{revPct}%</span>
                </div>
                <Progress value={revPct} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Remaining target */}
        <Card>
          <CardHeader>
            <CardTitle>Còn Cần Đạt</CardTitle>
            <Calendar size={14} className="text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  label: "Doanh Số",
                  remaining: Math.max(0, memberData.target.revenue - memberData.revenue),
                  unit: "VNĐ",
                  color: "text-blue-400",
                  bg: "bg-blue-500/10 border-blue-500/20",
                },
                {
                  label: "Đơn Hàng",
                  remaining: Math.max(0, memberData.target.orders - memberData.orders),
                  unit: "đơn",
                  color: "text-orange-400",
                  bg: "bg-orange-500/10 border-orange-500/20",
                },
                {
                  label: "Khách Hàng",
                  remaining: Math.max(0, memberData.target.customers - memberData.customers),
                  unit: "KH",
                  color: "text-green-400",
                  bg: "bg-green-500/10 border-green-500/20",
                },
              ].map((item) => (
                <div key={item.label} className={`rounded-lg border p-4 ${item.bg}`}>
                  <div className="text-xs text-slate-400 mb-1">{item.label} còn thiếu</div>
                  {item.remaining === 0 ? (
                    <div className="text-lg font-bold text-green-400">✓ Đã đạt!</div>
                  ) : (
                    <div className={`text-xl font-bold ${item.color}`}>
                      {item.unit === "VNĐ" ? formatVND(item.remaining) : item.remaining.toLocaleString()}
                      <span className="text-sm font-normal text-slate-400 ml-1">{item.unit !== "VNĐ" ? item.unit : ""}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {showAI && (
        <AiAnalysisPanel
          context="personal"
          data={memberData}
          onClose={() => setShowAI(false)}
        />
      )}
    </div>
  );
}
