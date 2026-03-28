"use client";

import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import { Header, PageHeader } from "@/components/layout/header";
import { KpiCard } from "@/components/layout/kpi-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatVND } from "@/lib/utils";
import { TEAM_KPIs, TEAMS } from "@/lib/mock-data";
import { Users, DollarSign, ShoppingCart, UserCircle, Sparkles, Trophy } from "lucide-react";
import { AiAnalysisPanel } from "@/components/ai/ai-analysis-panel";
import type { UserRole } from "@/lib/types";

interface TeamsClientProps {
  role: UserRole;
  teamId: string | null;
}

function pct(v: number, t: number) {
  return Math.round((v / t) * 100);
}

const TEAM_COLORS = ["#0066CC", "#10B981", "#F59E0B", "#8B5CF6"];

export function TeamsClient({ role, teamId }: TeamsClientProps) {
  const [showAI, setShowAI] = useState(false);
  const [activeTeam, setActiveTeam] = useState<string>("all");

  // Leader can only see own team
  const visibleTeams =
    role === "admin"
      ? TEAM_KPIs
      : TEAM_KPIs.filter((t) => t.teamId === teamId);

  const displayTeams =
    activeTeam === "all" ? visibleTeams : visibleTeams.filter((t) => t.teamId === activeTeam);

  // Summary totals for manager
  const totals = visibleTeams.reduce(
    (acc, t) => ({
      revenue: acc.revenue + t.revenue,
      orders: acc.orders + t.orders,
      customers: acc.customers + t.customers,
      targetRevenue: acc.targetRevenue + t.target.revenue,
      targetOrders: acc.targetOrders + t.target.orders,
      targetCustomers: acc.targetCustomers + t.target.customers,
    }),
    { revenue: 0, orders: 0, customers: 0, targetRevenue: 0, targetOrders: 0, targetCustomers: 0 }
  );

  // Comparison chart data
  const comparisonData = visibleTeams.map((t, i) => ({
    name: t.teamName,
    doanh_so: Math.round(t.revenue / 1_000_000),
    muc_tieu: Math.round(t.target.revenue / 1_000_000),
    color: TEAM_COLORS[i % TEAM_COLORS.length],
  }));

  return (
    <div>
      <Header title="Báo Cáo Nhóm">
        {role === "admin" && (
          <div className="flex gap-1">
            {[{ id: "all", label: "MBI" }, ...TEAMS.map((t) => ({ id: t.id, label: t.name }))].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTeam(item.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTeam === item.id
                    ? "bg-blue-600 text-white"
                    : "bg-slate-700 text-slate-400 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
        <Button variant="primary" size="sm" onClick={() => setShowAI(true)}>
          <Sparkles size={14} /> Trợ Lý AI
        </Button>
      </Header>

      <div className="p-6">
        <PageHeader
          title="Báo Cáo Nhóm"
          subtitle="Phân tích 5 chỉ số hiệu suất — Tổng hợp toàn MBC"
        />

        {/* Summary KPIs */}
        {role === "admin" && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <KpiCard
              title="Tổng Doanh Số Net"
              value={formatVND(totals.revenue)}
              target={formatVND(totals.targetRevenue)}
              percent={pct(totals.revenue, totals.targetRevenue)}
              icon={DollarSign}
              iconColor="text-green-400"
            />
            <KpiCard
              title="Số Đơn Hàng"
              value={totals.orders.toLocaleString()}
              target={totals.targetOrders.toLocaleString()}
              percent={pct(totals.orders, totals.targetOrders)}
              icon={ShoppingCart}
              iconColor="text-orange-400"
            />
            <KpiCard
              title="Số Khách Hàng"
              value={totals.customers.toLocaleString()}
              target={totals.targetCustomers.toLocaleString()}
              percent={pct(totals.customers, totals.targetCustomers)}
              icon={Users}
              iconColor="text-blue-400"
            />
          </div>
        )}

        {/* Team Comparison Chart */}
        {role === "admin" && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Doanh Số Net — Theo Team</CardTitle>
              <Badge variant="neutral">Net mode</Badge>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={comparisonData} barGap={8}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}M`} />
                  <Tooltip
                    contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#f1f5f9" }}
                    formatter={(v) => [`${v}M VNĐ`]}
                  />
                  <Bar dataKey="doanh_so" radius={[4, 4, 0, 0]} name="Doanh Số" opacity={0.5}>
                    {comparisonData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                  <Bar dataKey="muc_tieu" radius={[4, 4, 0, 0]} fill="#475569" name="Mục Tiêu" opacity={0.4} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Team Detail Cards */}
        <div className="space-y-6">
          {displayTeams.map((team, ti) => {
            const revPct = pct(team.revenue, team.target.revenue);
            return (
              <Card key={team.teamId}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ background: TEAM_COLORS[ti % TEAM_COLORS.length] }}
                    />
                    <CardTitle className="text-white text-base font-semibold">{team.teamName}</CardTitle>
                  </div>
                  <Badge variant={revPct >= 100 ? "success" : revPct >= 75 ? "brand" : revPct >= 50 ? "warning" : "danger"}>
                    {revPct}% chỉ tiêu
                  </Badge>
                </CardHeader>
                <CardContent>
                  {/* Team summary */}
                  <div className="grid grid-cols-3 gap-4 mb-5">
                    {[
                      { label: "Doanh Số", val: formatVND(team.revenue), tgt: formatVND(team.target.revenue), pct: revPct },
                      { label: "Đơn Hàng", val: team.orders, tgt: team.target.orders, pct: pct(team.orders, team.target.orders) },
                      { label: "Khách Hàng", val: team.customers, tgt: team.target.customers, pct: pct(team.customers, team.target.customers) },
                    ].map((item) => (
                      <div key={item.label} className="bg-slate-900/50 rounded-lg p-3">
                        <div className="text-xs text-slate-400 mb-1">{item.label}</div>
                        <div className="text-lg font-bold text-white">{item.val}</div>
                        <div className="text-xs text-slate-500 mb-2">/ {item.tgt}</div>
                        <Progress value={item.pct} />
                      </div>
                    ))}
                  </div>

                  {/* Members table */}
                  <div>
                    <div className="text-xs text-slate-500 font-medium mb-3 flex items-center gap-2">
                      <Trophy size={12} />
                      Bảng thành tích thành viên
                    </div>
                    <div className="space-y-2">
                      {[...team.members]
                        .sort((a, b) => b.revenue - a.revenue)
                        .map((member, mi) => {
                          const mRevPct = pct(member.revenue, member.target.revenue);
                          return (
                            <div
                              key={member.userId}
                              className="flex items-center gap-3 bg-slate-900/40 rounded-lg px-4 py-3 hover:bg-slate-900/60 transition-colors"
                            >
                              <span className="text-sm font-bold text-slate-500 w-5">#{mi + 1}</span>
                              <div className="w-7 h-7 bg-slate-700 rounded-full flex items-center justify-center text-xs text-slate-300 font-medium flex-shrink-0">
                                {member.name[0]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm text-white font-medium truncate">{member.name}</div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <Progress value={mRevPct} className="w-24" />
                                  <span className="text-xs text-slate-400">{mRevPct}%</span>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className="text-sm font-semibold text-white">{formatVND(member.revenue)}</div>
                                <div className="text-xs text-slate-500">{member.orders} đơn · {member.customers} KH</div>
                              </div>
                              <Badge variant={mRevPct >= 100 ? "success" : mRevPct >= 75 ? "brand" : mRevPct >= 50 ? "warning" : "danger"}>
                                {mRevPct}%
                              </Badge>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {showAI && (
        <AiAnalysisPanel
          context="teams"
          data={displayTeams}
          onClose={() => setShowAI(false)}
        />
      )}
    </div>
  );
}
