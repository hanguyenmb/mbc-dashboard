"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  ChevronLeft, ChevronRight, Printer, Sparkles, History,
  Plus, Pencil, Trash2, Check, X, Save, FileText, StickyNote,
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Header, PageHeader } from "@/components/layout/header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AiAnalysisPanel } from "@/components/ai/ai-analysis-panel";
import { AiHistoryPanel } from "@/components/ai/ai-history-panel";
import { WEEKLY_CATEGORIES } from "@/lib/mock-data";
import type { UserRole, WeeklyTask, TaskStatus } from "@/lib/types";

interface WeeklyClientProps { userName: string; role: UserRole; }

// ── Week utilities ────────────────────────────────────────────────────────────
function getWeekInfo(offset = 0) {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7) + offset * 7);
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
  const d = new Date(monday);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const w1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((d.getTime() - w1.getTime()) / 86400000 - 3 + (w1.getDay() + 6) % 7) / 7);
  const fmt = (dt: Date) => `${String(dt.getDate()).padStart(2,"0")}/${String(dt.getMonth()+1).padStart(2,"0")}`;
  return {
    weekNum, weekKey: `${monday.getFullYear()}-W${String(weekNum).padStart(2,"0")}`,
    label: `Tuần ${weekNum} | ${fmt(monday)} – ${fmt(sunday)}/${sunday.getFullYear()}`,
    labelShort: `Tuần ${weekNum} · ${fmt(monday)}–${fmt(sunday)}`,
    nextWeekKey: `${monday.getFullYear()}-W${String(weekNum+1).padStart(2,"0")}`,
    nextLabel: `Tuần ${weekNum+1} · ${fmt(new Date(sunday.getTime()+86400000))}–${fmt(new Date(sunday.getTime()+7*86400000))}`,
  };
}

const STATUS_META: Record<TaskStatus, { label: string; color: string; bg: string; dot: string }> = {
  done:       { label: "Hoàn thành",     color: "text-green-400", bg: "bg-green-500/10 border-green-500/30",  dot: "bg-green-400" },
  inprogress: { label: "Đang thực hiện", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30",  dot: "bg-amber-400" },
  notstarted: { label: "Chưa bắt đầu",   color: "text-slate-400", bg: "bg-slate-700/30 border-slate-600/30",  dot: "bg-slate-500" },
};

const CAT_MAP = Object.fromEntries(WEEKLY_CATEGORIES.map((c) => [c.id, c]));

// ── Task Form Modal ───────────────────────────────────────────────────────────
interface TaskFormData { title: string; description: string; category: string; status: TaskStatus; progress: number; }
const EMPTY_FORM: TaskFormData = { title: "", description: "", category: "doanh-so", status: "notstarted", progress: 0 };

function TaskModal({ task, weekKey, onSave, onClose }: {
  task: Partial<WeeklyTask> | null;
  weekKey: string;
  onSave: (data: TaskFormData & { id?: string }) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<TaskFormData>(
    task ? { title: task.title ?? "", description: task.description ?? "", category: task.category ?? "doanh-so", status: task.status ?? "notstarted", progress: task.progress ?? 0 }
         : { ...EMPTY_FORM }
  );
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    await onSave({ ...form, id: task?.id });
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <h3 className="text-white font-semibold">{task?.id ? "Chỉnh Sửa Tác Vụ" : "Thêm Tác Vụ Mới"}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Tiêu đề */}
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block font-medium">Tiêu đề *</label>
            <input
              value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Nhập tiêu đề tác vụ..."
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>
          {/* Mô tả */}
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block font-medium">Mô tả</label>
            <textarea
              value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Mô tả thêm về tác vụ..."
              rows={2}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none resize-none"
            />
          </div>
          {/* Nhóm + Trạng thái */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block font-medium">Nhóm</label>
              <select
                value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              >
                {WEEKLY_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1.5 block font-medium">Trạng thái</label>
              <select
                value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as TaskStatus }))}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="notstarted">Chưa bắt đầu</option>
                <option value="inprogress">Đang thực hiện</option>
                <option value="done">Hoàn thành</option>
              </select>
            </div>
          </div>
          {/* Tiến độ */}
          <div>
            <label className="text-xs text-slate-400 mb-1.5 flex justify-between font-medium">
              <span>Tiến độ</span><span className="text-orange-400 font-bold">{form.progress}%</span>
            </label>
            <input
              type="range" min={0} max={100} value={form.progress}
              onChange={(e) => setForm((f) => ({ ...f, progress: Number(e.target.value) }))}
              className="w-full accent-orange-400 cursor-pointer"
            />
          </div>
          {/* Buttons */}
          <div className="flex gap-2 pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} className="flex-1">Hủy</Button>
            <Button type="submit" variant="primary" size="sm" disabled={saving} className="flex-1">
              {saving ? "Đang lưu..." : <><Save size={14} /> Lưu</>}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete Confirm ────────────────────────────────────────────────────────────
function DeleteConfirm({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-sm p-6 text-center shadow-2xl">
        <div className="text-red-400 text-3xl mb-3">⚠️</div>
        <div className="text-white font-semibold mb-1">Xóa tác vụ này?</div>
        <div className="text-slate-400 text-sm mb-5">Hành động này không thể hoàn tác.</div>
        <div className="flex gap-3">
          <Button variant="ghost" size="sm" onClick={onCancel} className="flex-1">Hủy</Button>
          <Button variant="danger" size="sm" onClick={onConfirm} className="flex-1">Xóa</Button>
        </div>
      </div>
    </div>
  );
}

// ── Task Card ─────────────────────────────────────────────────────────────────
function TaskCard({ task, isManager, onEdit, onDelete, onProgressChange, onDetail }: {
  task: WeeklyTask; isManager: boolean;
  onEdit: (t: WeeklyTask) => void;
  onDelete: (id: string) => void;
  onProgressChange: (id: string, p: number) => void;
  onDetail: (t: WeeklyTask) => void;
}) {
  const cat = CAT_MAP[task.category];
  const [localProg, setLocalProg] = useState(task.progress);
  const liveStatus: TaskStatus = localProg === 100 ? "done" : localProg > 0 ? "inprogress" : "notstarted";
  const meta = STATUS_META[liveStatus];

  useEffect(() => { setLocalProg(task.progress); }, [task.progress]);

  function toggleDone() {
    const next = localProg === 100 ? 0 : 100;
    setLocalProg(next);
    onProgressChange(task.id, next);
  }

  const sliderStyle = {
    background: `linear-gradient(to right, #f97316 0%, #f97316 ${localProg}%, #334155 ${localProg}%, #334155 100%)`,
  };

  return (
    <div
      className="rounded-xl border p-3 space-y-2 group transition-colors"
      style={{
        background: `${cat?.color ?? "#94a3b8"}0d`,
        borderColor: `${cat?.color ?? "#94a3b8"}30`,
      }}
    >
      {/* Header row */}
      <div className="flex items-start gap-2">
        <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: cat?.color ?? "#94a3b8" }} />
        <div className="flex-1 min-w-0">
          <button onClick={() => onDetail(task)}
            className={`text-sm font-medium leading-snug text-left hover:underline decoration-dotted underline-offset-2 transition-colors ${liveStatus === "done" ? "line-through text-slate-400" : "text-slate-100 hover:text-blue-300"}`}>
            {task.title}
            {task.notes && <StickyNote size={10} className="inline ml-1.5 text-amber-400 opacity-80" />}
          </button>
          {task.description && <div className="text-xs text-slate-500 mt-0.5">{task.description}</div>}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full border ${meta.bg} ${meta.color}`}>{meta.label}</span>
          {isManager && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => onEdit(task)} className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-blue-400 transition-colors"><Pencil size={13} /></button>
              <button onClick={() => onDelete(task.id)} className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
            </div>
          )}
        </div>
      </div>

      {/* Slider row — manager: kéo được + nút tích; viewer: chỉ xem */}
      <div className="flex items-center gap-2">
        {/* Nút tích ✓ */}
        {isManager && (
          <button
            onClick={toggleDone}
            className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border transition-all ${
              liveStatus === "done"
                ? "bg-green-500 border-green-500 text-white"
                : "border-slate-500 hover:border-green-400 text-transparent hover:text-green-400"
            }`}
            title="Đánh dấu hoàn thành"
          >
            <Check size={11} strokeWidth={3} />
          </button>
        )}

        {/* Slider kéo (manager) hoặc thanh tĩnh (viewer) */}
        {isManager ? (
          <input
            type="range" min={0} max={100} value={localProg}
            onChange={(e) => setLocalProg(Number(e.target.value))}
            onMouseUp={() => onProgressChange(task.id, localProg)}
            onTouchEnd={() => onProgressChange(task.id, localProg)}
            className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
            style={sliderStyle}
          />
        ) : (
          <div className="flex-1 h-2 bg-slate-700/50 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${localProg}%`, background: "#f97316" }} />
          </div>
        )}

        <span className={`text-xs font-bold tabular-nums w-9 text-right ${liveStatus === "done" ? "text-green-400" : "text-orange-400"}`}>
          {localProg}%
        </span>
      </div>
    </div>
  );
}

// ── Task Detail Panel ─────────────────────────────────────────────────────────
function TaskDetailPanel({ task, isManager, onEdit, onSaveNotes, onClose }: {
  task: WeeklyTask;
  isManager: boolean;
  onEdit: (t: WeeklyTask) => void;
  onSaveNotes: (id: string, notes: string) => Promise<void>;
  onClose: () => void;
}) {
  const cat = CAT_MAP[task.category];
  const meta = STATUS_META[task.status];
  const [notes, setNotes] = useState(task.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSaveNotes() {
    setSaving(true);
    await onSaveNotes(task.id, notes);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start gap-3 px-5 py-4 border-b border-slate-700">
          <span className="w-3 h-3 rounded-full mt-1 flex-shrink-0" style={{ background: cat?.color ?? "#94a3b8" }} />
          <div className="flex-1 min-w-0">
            <div className="text-white font-semibold leading-snug">{task.title}</div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`text-xs px-2 py-0.5 rounded-full border ${meta.bg} ${meta.color}`}>{meta.label}</span>
              {cat && <span className="text-xs text-slate-500">{cat.name}</span>}
              <span className="text-xs text-orange-400 font-bold">{task.progress}%</span>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {isManager && (
              <button onClick={() => { onClose(); onEdit(task); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 transition-colors" title="Chỉnh sửa">
                <Pencil size={14} />
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Thanh tiến độ */}
          <div>
            <div className="flex justify-between text-xs text-slate-400 mb-1.5">
              <span>Tiến độ</span>
              <span className="text-orange-400 font-bold">{task.progress}%</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${task.progress}%`, background: "#f97316" }} />
            </div>
          </div>

          {/* Mô tả */}
          {task.description && (
            <div>
              <div className="text-xs text-slate-400 mb-1.5 flex items-center gap-1.5">
                <FileText size={12} /> Mô tả
              </div>
              <div className="text-sm text-slate-300 bg-slate-900/50 rounded-lg px-3 py-2.5 border border-slate-700/50">
                {task.description}
              </div>
            </div>
          )}

          {/* Ghi chú */}
          <div>
            <div className="text-xs text-slate-400 mb-1.5 flex items-center gap-1.5">
              <StickyNote size={12} /> Ghi chú chi tiết
            </div>
            <textarea
              value={notes}
              onChange={(e) => { setNotes(e.target.value); setSaved(false); }}
              placeholder="Nhập ghi chú, kết quả, vướng mắc, số liệu cụ thể..."
              rows={5}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-700 flex gap-3">
          <Button variant="ghost" size="sm" onClick={onClose} className="flex-1 justify-center">Đóng</Button>
          <Button variant="primary" size="sm" onClick={handleSaveNotes} disabled={saving} className="flex-1 justify-center">
            {saving ? "Đang lưu..." : saved ? <><Check size={13} /> Đã lưu</> : <><Save size={13} /> Lưu ghi chú</>}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function WeeklyClient({ userName, role }: WeeklyClientProps) {
  const isManager = role === "admin";
  const [weekOffset, setWeekOffset] = useState(0);
  const [activeTab, setActiveTab] = useState<"current" | "next" | "manage">("current");
  const [showAI, setShowAI] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [tasks, setTasks] = useState<WeeklyTask[]>([]);
  const [nextTasks, setNextTasks] = useState<WeeklyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalTask, setModalTask] = useState<Partial<WeeklyTask> | null | "new">(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [detailTask, setDetailTask] = useState<WeeklyTask | null>(null);
  const [newTaskCategory, setNewTaskCategory] = useState("doanh-so");

  const week = useMemo(() => getWeekInfo(weekOffset), [weekOffset]);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    const [r1, r2] = await Promise.all([
      fetch(`/api/weekly?weekKey=${week.weekKey}`).then((r) => r.json()),
      fetch(`/api/weekly?weekKey=${week.nextWeekKey}`).then((r) => r.json()),
    ]);
    setTasks(r1.tasks ?? []);
    setNextTasks(r2.tasks ?? []);
    setLoading(false);
  }, [week.weekKey, week.nextWeekKey]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // KPIs
  const done       = tasks.filter((t) => t.status === "done").length;
  const inprogress = tasks.filter((t) => t.status === "inprogress").length;
  const notstarted = tasks.filter((t) => t.status === "notstarted").length;
  const total      = tasks.length;
  const avgProgress = total > 0 ? Math.round(tasks.reduce((s, t) => s + t.progress, 0) / total) : 0;

  const donutData = [
    { name: "Hoàn thành",     value: done || 0.01,       color: "#22c55e" },
    { name: "Đang thực hiện", value: inprogress || 0.01, color: "#f97316" },
    { name: "Chưa bắt đầu",   value: notstarted || 0.01, color: "#475569" },
  ];

  const grouped = WEEKLY_CATEGORIES.map((cat) => ({
    cat, tasks: tasks.filter((t) => t.category === cat.id),
  })).filter((g) => g.tasks.length > 0);

  const nextGrouped = WEEKLY_CATEGORIES.map((cat) => ({
    cat, tasks: nextTasks.filter((t) => t.category === cat.id),
  })).filter((g) => g.tasks.length > 0);

  // CRUD handlers
  async function handleSaveTask(data: TaskFormData & { id?: string }) {
    if (data.id) {
      await fetch("/api/weekly", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: data.id, ...data }) });
    } else {
      await fetch("/api/weekly", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, weekKey: activeTab === "next" ? week.nextWeekKey : week.weekKey }) });
    }
    await fetchTasks();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/weekly?id=${id}`, { method: "DELETE" });
    setDeleteId(null);
    await fetchTasks();
  }

  async function handleProgressChange(id: string, progress: number) {
    // Tự động cập nhật trạng thái theo tiến độ
    const status: TaskStatus = progress === 100 ? "done" : progress > 0 ? "inprogress" : "notstarted";
    await fetch("/api/weekly", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, progress, status }) });
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, progress, status } : t));
  }

  async function handleSaveNotes(id: string, notes: string) {
    await fetch("/api/weekly", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, notes }) });
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, notes } : t));
    setNextTasks((prev) => prev.map((t) => t.id === id ? { ...t, notes } : t));
    if (detailTask?.id === id) setDetailTask((prev) => prev ? { ...prev, notes } : prev);
  }

  function openAddTask(category: string, forNextWeek = false) {
    setNewTaskCategory(category);
    if (forNextWeek) setActiveTab("next");
    setModalTask("new");
  }

  const TOOLTIP_STYLE = { contentStyle: { background: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#f1f5f9", fontSize: 12 } };

  return (
    <div>
      <Header title="Báo Cáo Tuần">
        {isManager && (
          <Button variant="primary" size="sm" onClick={() => { setNewTaskCategory("doanh-so"); setModalTask("new"); }}>
            <Plus size={14} /> Thêm Tác Vụ
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={() => setShowHistory(true)}><History size={14} /> Lịch Sử AI</Button>
        <Button variant="ghost" size="sm" onClick={() => setShowAI(true)}><Sparkles size={14} /> Trợ Lý AI</Button>
        <Button variant="ghost" size="sm" onClick={() => window.print()}><Printer size={14} /> In</Button>
      </Header>

      <div className="p-6 space-y-5">
        <PageHeader title="Dashboard Báo Cáo Công Việc" subtitle={`${userName} · ${new Date().toLocaleDateString("vi-VN")}`}>
          <div className="flex items-center gap-2">
            <button onClick={() => setWeekOffset((o) => o - 1)} className="p-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-slate-400 hover:text-white transition-colors"><ChevronLeft size={16} /></button>
            <div className="px-4 py-1.5 bg-slate-700/50 rounded-lg text-sm text-white font-medium min-w-[220px] text-center">{week.label}</div>
            <button onClick={() => setWeekOffset((o) => o + 1)} className="p-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-slate-400 hover:text-white transition-colors"><ChevronRight size={16} /></button>
            <button onClick={() => setWeekOffset(0)} className="px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs font-medium hover:bg-blue-600/30 transition-colors">Hôm nay</button>
          </div>
        </PageHeader>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Tổng công việc", value: total,      color: "border-slate-600 text-white",        sub: "tác vụ" },
            { label: "Hoàn thành",     value: done,       color: "border-green-500/30 text-green-400", sub: `${total > 0 ? Math.round(done/total*100) : 0}%` },
            { label: "Đang thực hiện", value: inprogress, color: "border-amber-500/30 text-amber-400", sub: `avg ${avgProgress}%` },
            { label: "Chưa bắt đầu",   value: notstarted, color: "border-slate-600/30 text-slate-400", sub: "chờ xử lý" },
          ].map((item) => (
            <div key={item.label} className={`bg-slate-800/60 rounded-xl border p-4 ${item.color.split(" ")[0]}`}>
              <div className="text-xs text-slate-400 mb-2">{item.label}</div>
              <div className={`text-3xl font-bold ${item.color.split(" ")[1]}`}>{item.value}</div>
              <div className="text-xs text-slate-500 mt-1">{item.sub}</div>
            </div>
          ))}
        </div>

        {/* Donut + Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Tổng Quan Tiến Độ</CardTitle><Badge variant="neutral">{week.labelShort}</Badge></CardHeader>
            <CardContent>
              <div className="relative flex justify-center">
                <ResponsiveContainer width="100%" height={190}>
                  <PieChart>
                    <Pie data={donutData} cx="50%" cy="50%" innerRadius={58} outerRadius={85} paddingAngle={2} dataKey="value">
                      {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip {...TOOLTIP_STYLE} formatter={(v: any) => [`${v} việc`]} />
                  </PieChart>
                </ResponsiveContainer>
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
                    <span className={`text-xs ${row.color} w-8 text-right`}>{row.pct}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader><CardTitle>Tiến Độ Việc Đang Làm</CardTitle><Badge variant="neutral">{inprogress} việc</Badge></CardHeader>
            <CardContent>
              {loading ? <div className="text-sm text-slate-500 text-center py-8">Đang tải...</div> :
               tasks.filter((t) => t.status === "inprogress").length === 0 ? (
                <div className="text-sm text-slate-500 text-center py-8">Không có việc đang làm</div>
              ) : (
                <div className="space-y-3">
                  {tasks.filter((t) => t.status === "inprogress").sort((a, b) => b.progress - a.progress).map((task) => (
                    <div key={task.id} className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CAT_MAP[task.category]?.color ?? "#94a3b8" }} />
                      <span className="text-xs text-slate-300 flex-1 line-clamp-1" title={task.title}>{task.title}</span>
                      <div className="w-32 h-2 bg-slate-700/50 rounded-full overflow-hidden flex-shrink-0">
                        <div className="h-full rounded-full" style={{ width: `${task.progress}%`, background: "#f97316" }} />
                      </div>
                      <span className="text-xs font-semibold text-orange-400 w-8 text-right tabular-nums">{task.progress}%</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-800/50 rounded-xl p-1 w-fit">
          {[
            { key: "current", label: "Báo Cáo Tuần Này" },
            { key: "next",    label: "Kế Hoạch Tuần Tới" },
            ...(isManager ? [{ key: "manage", label: "Quản Lý Tác Vụ" }] : []),
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab: Báo cáo tuần này */}
        {activeTab === "current" && (
          <div className="space-y-4">
            {loading ? <div className="text-sm text-slate-500 text-center py-12">Đang tải...</div> :
             grouped.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                Chưa có tác vụ tuần này.
                {isManager && <button onClick={() => openAddTask("doanh-so")} className="ml-2 text-blue-400 hover:underline">Thêm tác vụ</button>}
              </div>
            ) : grouped.map(({ cat, tasks: grpTasks }) => {
              const doneCnt = grpTasks.filter((t) => t.status === "done").length;
              return (
                <div key={cat.id} className="bg-slate-800/30 rounded-2xl border border-slate-700/30 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3" style={{ background: `${cat.color}12`, borderLeft: `3px solid ${cat.color}` }}>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: cat.color }} />
                      <span className="text-sm font-semibold text-white">{cat.name}</span>
                      <span className="text-xs text-slate-400">{grpTasks.length} việc</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400">{doneCnt}/{grpTasks.length} xong</span>
                      {isManager && (
                        <button onClick={() => openAddTask(cat.id)} className="flex items-center gap-1 text-xs text-slate-400 hover:text-blue-400 border border-slate-600 hover:border-blue-500 px-2 py-1 rounded-lg transition-colors">
                          <Plus size={12} /> Thêm
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="p-3 space-y-2">
                    {grpTasks.map((task) => (
                      <TaskCard key={task.id} task={task} isManager={isManager}
                        onEdit={(t) => setModalTask(t)}
                        onDelete={(id) => setDeleteId(id)}
                        onProgressChange={handleProgressChange}
                        onDetail={(t) => setDetailTask(t)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab: Kế hoạch tuần tới */}
        {activeTab === "next" && (
          <div className="space-y-4">
            {nextGrouped.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                Chưa có kế hoạch tuần tới.
                {isManager && <button onClick={() => openAddTask("doanh-so", true)} className="ml-2 text-blue-400 hover:underline">Thêm tác vụ</button>}
              </div>
            ) : nextGrouped.map(({ cat, tasks: grpTasks }) => (
              <div key={cat.id} className="bg-slate-800/30 rounded-2xl border border-slate-700/30 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3" style={{ background: `${cat.color}12`, borderLeft: `3px solid ${cat.color}` }}>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: cat.color }} />
                    <span className="text-sm font-semibold text-white">{cat.name}</span>
                    <span className="text-xs text-slate-400">{grpTasks.length} việc</span>
                  </div>
                  {isManager && (
                    <button onClick={() => openAddTask(cat.id, true)} className="flex items-center gap-1 text-xs text-slate-400 hover:text-blue-400 border border-slate-600 hover:border-blue-500 px-2 py-1 rounded-lg transition-colors">
                      <Plus size={12} /> Thêm
                    </button>
                  )}
                </div>
                <div className="p-3 space-y-2">
                  {grpTasks.map((task) => (
                    <TaskCard key={task.id} task={task} isManager={isManager}
                      onEdit={(t) => setModalTask(t)}
                      onDelete={(id) => setDeleteId(id)}
                      onProgressChange={handleProgressChange}
                      onDetail={(t) => setDetailTask(t)}
                    />
                  ))}
                </div>
              </div>
            ))}
            {isManager && nextGrouped.length > 0 && (
              <button onClick={() => openAddTask("doanh-so", true)} className="w-full border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-xl py-3 text-sm text-slate-500 hover:text-blue-400 transition-colors flex items-center justify-center gap-2">
                <Plus size={14} /> Thêm tác vụ mới
              </button>
            )}
          </div>
        )}

        {/* Tab: Quản lý tác vụ (manager only) */}
        {activeTab === "manage" && isManager && (
          <Card>
            <CardHeader>
              <CardTitle>Quản Lý Tác Vụ</CardTitle>
              <Button variant="primary" size="sm" onClick={() => { setNewTaskCategory("doanh-so"); setModalTask("new"); }}>
                <Plus size={14} /> Thêm tác vụ
              </Button>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <div className="text-sm text-slate-500 text-center py-8">Chưa có tác vụ</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        {["Tác vụ", "Nhóm", "Trạng thái", "Tiến độ", ""].map((h) => (
                          <th key={h} className="text-left text-xs text-slate-400 font-medium py-2 px-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/50">
                      {tasks.map((task) => {
                        const cat = CAT_MAP[task.category];
                        const meta = STATUS_META[task.status];
                        return (
                          <tr key={task.id} className="hover:bg-slate-700/20 transition-colors group">
                            <td className="py-3 px-3">
                              <div className="text-slate-200 font-medium line-clamp-1">{task.title}</div>
                              {task.description && <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{task.description}</div>}
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full" style={{ background: cat?.color }} />
                                <span className="text-slate-300 text-xs">{cat?.name}</span>
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <span className={`text-xs px-2 py-0.5 rounded-full border ${meta.bg} ${meta.color}`}>{meta.label}</span>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full bg-orange-400" style={{ width: `${task.progress}%` }} />
                                </div>
                                <span className="text-xs text-orange-400 tabular-nums">{task.progress}%</span>
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setModalTask(task)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-blue-400 transition-colors"><Pencil size={13} /></button>
                                <button onClick={() => setDeleteId(task.id)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Task Modal */}
      {modalTask !== null && (
        <TaskModal
          task={modalTask === "new" ? { category: newTaskCategory } : modalTask}
          weekKey={activeTab === "next" ? week.nextWeekKey : week.weekKey}
          onSave={handleSaveTask}
          onClose={() => setModalTask(null)}
        />
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <DeleteConfirm
          onConfirm={() => handleDelete(deleteId)}
          onCancel={() => setDeleteId(null)}
        />
      )}

      {detailTask && (
        <TaskDetailPanel
          task={detailTask}
          isManager={isManager}
          onEdit={(t) => setModalTask(t)}
          onSaveNotes={handleSaveNotes}
          onClose={() => setDetailTask(null)}
        />
      )}
      {showHistory && <AiHistoryPanel onClose={() => setShowHistory(false)} />}
      {showAI && (
        <AiAnalysisPanel
          context="weekly"
          data={{ week: week.label, tasks, total: tasks.length, avgProgress, done, inprogress, notstarted }}
          onClose={() => setShowAI(false)}
        />
      )}
    </div>
  );
}
