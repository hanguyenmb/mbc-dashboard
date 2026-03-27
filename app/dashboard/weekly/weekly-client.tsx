"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Printer, Download, Sparkles } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Header, PageHeader } from "@/components/layout/header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AiAnalysisPanel } from "@/components/ai/ai-analysis-panel";
import { WEEKLY_TASKS, WEEKLY_CATEGORIES } from "@/lib/mock-data";
import type { UserRole, WeeklyTask, TaskStatus } from "@/lib/types";

interface WeeklyClientProps {
  userName: string;
  role: UserRole;
}

// ── Week utilities ────────────────────────────────────────────────────────────
function getWeekInfo(offset = 0) {
  const now = new Date(2026, 2, 27); // current date: 27/03/2026
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7) + offset * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  // ISO week number
  const d = new Date(monday);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const w1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((d.getTime() - w1.getTime()) / 86400000 - 3 + (w1.getDay() + 6) % 7) / 7);

  const fmt = (dt: Date) => `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}`;
  return {
    weekNum,
    year: monday.getFullYear(),
    weekKey: `${monday.getFullYear()}-W${String(weekNum).padStart(2, "0")}`,
    label: `Tuần ${weekNum} | ${fmt(monday)} – ${fmt(sunday)}/${sunday.getFullYear()}`,
    labelShort: `Tuần ${weekNum} · ${fmt(monday)}–${fmt(sunday)}`,
    nextWeekKey: `${monday.getFullYear()}-W${String(weekNum + 1).padStart(2, "0")}`,
    nextLabel: `Tuần ${weekNum + 1} · ${fmt(new Date(sunday.getTime() + 86400000))}–${fmt(new Date(sunday.getTime() + 7 * 86400000))}`,
  };
}

// ── Status helpers ────────────────────────────────────────────────────────────
const STATUS_META: Record<TaskStatus, { label: string; color: string; bg: string; dot: string }> = {
  done:        { label: "Hoàn thành",     color: "text-green-400",  bg: "bg-green-500/10 border-green-500/30",  dot: "bg-green-400" },
  inprogress:  { label: "Đang thực hiện", color: "text-amber-400",  bg: "bg-amber-500/10 border-amber-500/30",  dot: "bg-amber-400" },
  notstarted:  { label: "Chưa bắt đầu",   color: "text-slate-400",  bg: "bg-slate-700/30 border-slate-600/30",  dot: "bg-slate-500" },
};

const CAT_COLOR: Record<string, string> = Object.fromEntries(
  WEEKLY_CATEGORIES.map((c) => [c.id, c.color])
);

// ── Progress bar component ────────────────────────────────────────────────────
function ProgressBar({ value, color = "#f97316" }: { value: number; color?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-slate-700/50 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
      <span className="text-xs font-semibold tabular-nums w-8 text-right" style={{ color }}>
        {value}%
      </span>
    </div>
  );
}

// ── Task card ─────────────────────────────────────────────────────────────────
function TaskCard({ task, editable = false, onProgressChange }: {
  task: WeeklyTask;
  editable?: boolean;
  onProgressChange?: (id: string, progress: number) => void;
}) {
  const meta = STATUS_META[task.status];
  const cat = WEEKLY_CATEGORIES.find((c) => c.id === task.category);

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/40 p-4 space-y-3">
      <div className="flex items-start gap-2">
        <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: cat?.color ?? "#94a3b8" }} />
        <div className="flex-1 min-w-0">
          <div className="text-sm text-slate-100 font-medium leading-snug">{task.title}</div>
          {task.description && (
            <div className="text-xs text-slate-500 mt-0.5">{task.description}</div>
          )}
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${meta.bg} ${meta.color}`}>
          {meta.label}
        </span>
      </div>

      {editable && onProgressChange ? (
        <div className="space-y-1">
          <ProgressBar value={task.progress} />
          <input
            type="range" min={0} max={100} value={task.progress}
            onChange={(e) => onProgressChange(task.id, Number(e.target.value))}
            className="w-full h-1 accent-orange-400 cursor-pointer"
          />
        </div>
      ) : (
        <ProgressBar value={task.progress} />
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function WeeklyClient({ userName, role }: WeeklyClientProps) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [showAI, setShowAI] = useState(false);
  const [taskProgress, setTaskProgress] = useState<Record<string, number>>({});

  const week = useMemo(() => getWeekInfo(weekOffset), [weekOffset]);

  // Merge overridden progress with mock data
  const currentTasks = useMemo(() =>
    WEEKLY_TASKS
      .filter((t) => t.weekKey === week.weekKey)
      .map((t) => ({ ...t, progress: taskProgress[t.id] ?? t.progress })),
    [week.weekKey, taskProgress]
  );

  const nextTasks = useMemo(() =>
    WEEKLY_TASKS.filter((t) => t.weekKey === week.nextWeekKey),
    [week.nextWeekKey]
  );

  // KPI counts
  const done       = currentTasks.filter((t) => t.status === "done").length;
  const inprogress = currentTasks.filter((t) => t.status === "inprogress").length;
  const notstarted = currentTasks.filter((t) => t.status === "notstarted").length;
  const total      = currentTasks.length;
  const avgProgress = total > 0 ? Math.round(currentTasks.reduce((s, t) => s + t.progress, 0) / total) : 0;

  // Donut data
  const donutData = [
    { name: "Hoàn thành",     value: done || 0.01,  color: "#22c55e" },
    { name: "Đang thực hiện", value: inprogress || 0.01, color: "#f97316" },
    { name: "Chưa bắt đầu",   value: notstarted || 0.01, color: "#475569" },
  ].filter((d) => d.value > 0.01 || done + inprogress + notstarted === 0);

  // Group by category for current week
  const grouped = WEEKLY_CATEGORIES.map((cat) => ({
    cat,
    tasks: currentTasks.filter((t) => t.category === cat.id),
  })).filter((g) => g.tasks.length > 0);

  const nextGrouped = WEEKLY_CATEGORIES.map((cat) => ({
    cat,
    tasks: nextTasks.filter((t) => t.category === cat.id),
  })).filter((g) => g.tasks.length > 0);

  function handleProgressChange(id: string, progress: number) {
    setTaskProgress((prev) => ({ ...prev, [id]: progress }));
  }

  function handlePrint() {
    window.print();
  }

  const TOOLTIP_STYLE = {
    contentStyle: {
      background: "#1e293b", border: "1px solid #334155",
      borderRadius: 8, color: "#f1f5f9", fontSize: 12,
    },
  };

  return (
    <div>
      <Header title="Báo Cáo Tuần">
        <Button variant="ghost" size="sm" onClick={() => setShowAI(true)}>
          <Sparkles size={14} /> Phân Tích AI
        </Button>
        <Button variant="ghost" size="sm" onClick={handlePrint}>
          <Printer size={14} /> In báo cáo
        </Button>
        <Button variant="ghost" size="sm">
          <Download size={14} /> Xuất HTML
        </Button>
      </Header>

      <div className="p-6 space-y-5">
        <PageHeader
          title="Dashboard Báo Cáo Công Việc"
          subtitle={`${userName} · 27/03/2026`}
        >
          {/* Week navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekOffset((o) => o - 1)}
              className="p-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="px-4 py-1.5 bg-slate-700/50 rounded-lg text-sm text-white font-medium min-w-[220px] text-center">
              {week.label}
            </div>
            <button
              onClick={() => setWeekOffset((o) => o + 1)}
              className="p-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-slate-400 hover:text-white transition-colors"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => setWeekOffset(0)}
              className="px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs font-medium hover:bg-blue-600/30 transition-colors"
            >
              Hôm nay
            </button>
          </div>
        </PageHeader>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Tổng công việc tuần này", value: total,      color: "border-slate-600 text-white",        sub: "tác vụ" },
            { label: "Hoàn thành",              value: done,       color: "border-green-500/30 text-green-400", sub: `${total > 0 ? Math.round(done/total*100) : 0}% tổng số` },
            { label: "Đang thực hiện",          value: inprogress, color: "border-amber-500/30 text-amber-400", sub: `avg ${avgProgress}% tiến độ` },
            { label: "Chưa bắt đầu",            value: notstarted, color: "border-slate-600/30 text-slate-400", sub: "chờ xử lý" },
          ].map((item) => (
            <div key={item.label} className={`bg-slate-800/60 rounded-xl border p-4 ${item.color.split(" ")[0]}`}>
              <div className="text-xs text-slate-400 mb-2">{item.label}</div>
              <div className={`text-3xl font-bold ${item.color.split(" ")[1]}`}>{item.value}</div>
              <div className="text-xs text-slate-500 mt-1">{item.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Donut + Progress list ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Donut */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Tổng Quan Tiến Độ</CardTitle>
              <Badge variant="neutral">{week.labelShort}</Badge>
            </CardHeader>
            <CardContent>
              <div className="relative flex justify-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={donutData} cx="50%" cy="50%"
                      innerRadius={60} outerRadius={90}
                      paddingAngle={2} dataKey="value"
                    >
                      {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip {...TOOLTIP_STYLE} formatter={(v: any) => [`${v} việc`]} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="text-2xl font-bold text-white">{avgProgress}%</div>
                  <div className="text-xs text-slate-400">hoàn thành</div>
                </div>
              </div>
              <div className="space-y-2 mt-2">
                {[
                  { label: "Hoàn thành",     count: done,       pct: total > 0 ? Math.round(done/total*100) : 0,       color: "text-green-400", dot: "bg-green-400" },
                  { label: "Đang thực hiện", count: inprogress, pct: total > 0 ? Math.round(inprogress/total*100) : 0, color: "text-amber-400", dot: "bg-amber-400" },
                  { label: "Chưa bắt đầu",   count: notstarted, pct: total > 0 ? Math.round(notstarted/total*100) : 0, color: "text-slate-400", dot: "bg-slate-500" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${row.dot}`} />
                    <span className="text-xs text-slate-300 flex-1">{row.label}</span>
                    <span className={`text-xs font-semibold ${row.color}`}>{row.count} việc</span>
                    <span className={`text-xs ${row.color} w-10 text-right`}>{row.pct}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Progress list */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Tiến Độ Việc Đang Làm</CardTitle>
              <Badge variant="neutral">{inprogress} việc</Badge>
            </CardHeader>
            <CardContent>
              {currentTasks.filter((t) => t.status === "inprogress").length === 0 ? (
                <div className="text-sm text-slate-500 text-center py-8">Không có việc đang làm</div>
              ) : (
                <div className="space-y-3">
                  {currentTasks
                    .filter((t) => t.status === "inprogress")
                    .sort((a, b) => b.progress - a.progress)
                    .map((task) => (
                      <div key={task.id} className="flex items-center gap-3">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: CAT_COLOR[task.category] ?? "#94a3b8" }}
                        />
                        <span className="text-xs text-slate-300 flex-1 line-clamp-1" title={task.title}>
                          {task.title}
                        </span>
                        <div className="w-32 h-2 bg-slate-700/50 rounded-full overflow-hidden flex-shrink-0">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${task.progress}%`, background: "#f97316" }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-orange-400 w-8 text-right tabular-nums">
                          {task.progress}%
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Báo cáo tuần này + Kế hoạch tuần tới ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Báo cáo tuần này */}
          <Card>
            <CardHeader>
              <CardTitle>Báo Cáo Tuần Này</CardTitle>
              <span className="text-xs text-slate-400">{week.labelShort}</span>
            </CardHeader>
            <CardContent className="space-y-4">
              {grouped.length === 0 ? (
                <div className="text-sm text-slate-500 text-center py-8">Chưa có công việc tuần này</div>
              ) : (
                grouped.map(({ cat, tasks }) => {
                  const doneCnt = tasks.filter((t) => t.status === "done").length;
                  return (
                    <div key={cat.id}>
                      {/* Category header */}
                      <div
                        className="flex items-center justify-between px-3 py-2 rounded-lg mb-2 cursor-default"
                        style={{ background: `${cat.color}15`, borderLeft: `3px solid ${cat.color}` }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ background: cat.color }} />
                          <span className="text-sm font-medium text-white">{cat.name}</span>
                          <span className="text-xs text-slate-400">{tasks.length} việc</span>
                        </div>
                        <span className="text-xs text-slate-400">{doneCnt}/{tasks.length} xong</span>
                      </div>
                      {/* Tasks */}
                      <div className="space-y-2 pl-2">
                        {tasks.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            editable={role === "manager" || role === "leader"}
                            onProgressChange={handleProgressChange}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Kế hoạch tuần tới */}
          <Card>
            <CardHeader>
              <CardTitle>Kế Hoạch Tuần Tới</CardTitle>
              <span className="text-xs text-slate-400">{week.nextLabel}</span>
            </CardHeader>
            <CardContent className="space-y-4">
              {nextGrouped.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="text-slate-600 text-sm">Chưa có kế hoạch cho tuần tới</div>
                  <button className="text-xs text-blue-400 hover:text-blue-300 border border-blue-500/30 px-3 py-1.5 rounded-lg transition-colors">
                    + Thêm công việc
                  </button>
                </div>
              ) : (
                nextGrouped.map(({ cat, tasks }) => (
                  <div key={cat.id}>
                    <div
                      className="flex items-center gap-2 px-3 py-2 rounded-lg mb-2"
                      style={{ background: `${cat.color}15`, borderLeft: `3px solid ${cat.color}` }}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ background: cat.color }} />
                      <span className="text-sm font-medium text-white">{cat.name}</span>
                      <span className="text-xs text-slate-400">{tasks.length} việc</span>
                    </div>
                    <div className="space-y-2 pl-2">
                      {tasks.map((task) => (
                        <div key={task.id} className="bg-slate-800/50 rounded-xl border border-slate-700/40 p-3">
                          <div className="flex items-start gap-2">
                            <span className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ background: cat.color }} />
                            <div className="flex-1">
                              <div className="text-sm text-slate-200">{task.title}</div>
                              {task.description && (
                                <div className="text-xs text-slate-500 mt-0.5">{task.description}</div>
                              )}
                            </div>
                            <span className="text-xs text-slate-500 border border-slate-600 px-2 py-0.5 rounded-full flex-shrink-0">
                              Chưa bắt đầu
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button className="mt-2 ml-2 text-xs text-slate-500 hover:text-blue-400 transition-colors">
                      + Thêm công việc
                    </button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {showAI && (
        <AiAnalysisPanel
          context="overview"
          data={{ week: week.label, tasks: currentTasks, avgProgress, done, inprogress, notstarted }}
          onClose={() => setShowAI(false)}
        />
      )}
    </div>
  );
}
