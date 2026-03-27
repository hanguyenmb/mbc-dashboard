"use client";

import { useState } from "react";
import { Header, PageHeader } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { USERS, TEAMS } from "@/lib/mock-data";
import type { User, UserRole } from "@/lib/types";
import {
  UserPlus, Edit2, Trash2, Search, Shield, Users, UserCircle,
} from "lucide-react";

const ROLE_LABELS: Record<UserRole, string> = {
  manager: "Quản Trị",
  leader: "Team Leader",
  employee: "Nhân Viên",
};
const ROLE_BADGE: Record<UserRole, "danger" | "brand" | "neutral"> = {
  manager: "danger",
  leader: "brand",
  employee: "neutral",
};
const ROLE_ICON: Record<UserRole, React.ElementType> = {
  manager: Shield,
  leader: Users,
  employee: UserCircle,
};

export function UsersClient() {
  const [users] = useState<User[]>(USERS);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<UserRole | "all">("all");
  const [showAddModal, setShowAddModal] = useState(false);

  const filtered = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "all" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  function getTeamName(teamId: string | null) {
    if (!teamId) return "—";
    return TEAMS.find((t) => t.id === teamId)?.name ?? teamId;
  }

  const stats = {
    total: users.length,
    managers: users.filter((u) => u.role === "manager").length,
    leaders: users.filter((u) => u.role === "leader").length,
    employees: users.filter((u) => u.role === "employee").length,
  };

  return (
    <div>
      <Header title="Quản Lý User">
        <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
          <UserPlus size={14} /> Thêm User
        </Button>
      </Header>

      <div className="p-6">
        <PageHeader
          title="Quản Lý User"
          subtitle="Tạo, cấp quyền và quản lý tài khoản người dùng"
        />

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Tổng Users", value: stats.total, color: "text-white", bg: "border-slate-700/50" },
            { label: "Quản Trị", value: stats.managers, color: "text-red-400", bg: "border-red-500/20" },
            { label: "Team Leader", value: stats.leaders, color: "text-blue-400", bg: "border-blue-500/20" },
            { label: "Nhân Viên", value: stats.employees, color: "text-slate-300", bg: "border-slate-600/50" },
          ].map((s) => (
            <div key={s.label} className={`bg-slate-800/60 rounded-xl border p-4 ${s.bg}`}>
              <div className="text-xs text-slate-400 mb-1">{s.label}</div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <Card className="mb-4">
          <CardContent className="pt-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm theo tên hoặc email..."
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-300 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex gap-2">
                {(["all", "manager", "leader", "employee"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setFilterRole(r)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      filterRole === r
                        ? "bg-blue-600 text-white"
                        : "bg-slate-700 text-slate-400 hover:text-white"
                    }`}
                  >
                    {r === "all" ? "Tất cả" : ROLE_LABELS[r]}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users table */}
        <Card>
          <CardHeader>
            <CardTitle>{filtered.length} người dùng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filtered.map((user) => {
                const RoleIcon = ROLE_ICON[user.role];
                return (
                  <div
                    key={user.id}
                    className="flex items-center gap-4 bg-slate-900/40 rounded-lg px-4 py-3.5 hover:bg-slate-900/60 transition-colors group"
                  >
                    {/* Avatar */}
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {user.avatar || user.name[0]}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm font-medium">{user.name}</span>
                        <Badge variant={ROLE_BADGE[user.role]}>
                          <RoleIcon size={10} className="mr-1" />
                          {ROLE_LABELS[user.role]}
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{user.email}</div>
                    </div>

                    {/* Team */}
                    <div className="text-sm text-slate-400 hidden md:block">
                      {getTeamName(user.teamId)}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors">
                        <Edit2 size={13} />
                      </button>
                      {user.role !== "manager" && (
                        <button className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Add user modal (simplified) */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <h3 className="text-lg font-semibold text-white mb-5">Thêm User Mới</h3>
              <div className="space-y-4">
                {[
                  { label: "Họ Tên", placeholder: "Nguyễn Văn A", type: "text" },
                  { label: "Email", placeholder: "email@matbao.net", type: "email" },
                  { label: "Mật Khẩu", placeholder: "••••••••", type: "password" },
                ].map((f) => (
                  <div key={f.label}>
                    <label className="block text-sm text-slate-400 mb-1.5">{f.label}</label>
                    <input
                      type={f.type}
                      placeholder={f.placeholder}
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Vai Trò</label>
                  <select className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500">
                    <option value="employee">Nhân Viên</option>
                    <option value="leader">Team Leader</option>
                    <option value="manager">Quản Trị</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Team</label>
                  <select className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500">
                    <option value="">— Không thuộc team —</option>
                    {TEAMS.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => setShowAddModal(false)} className="flex-1 justify-center">
                  Hủy
                </Button>
                <Button variant="primary" className="flex-1 justify-center">
                  <UserPlus size={14} /> Tạo User
                </Button>
              </div>
              <p className="text-xs text-slate-500 text-center mt-3">
                * Phase 2: Lưu vào database. Hiện tại là demo UI.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
