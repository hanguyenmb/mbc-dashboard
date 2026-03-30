"use client";

import { useState } from "react";
import { Header, PageHeader } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { User, UserRole } from "@/lib/types";
import { UserPlus, Edit2, Trash2, Search, Shield, Eye, BarChart2, X, Check, Clock, Loader2 } from "lucide-react";

const ROLE_LABELS: Record<UserRole, string> = {
  admin:      "Quản Trị",
  viewer:     "Xem toàn bộ",
  teams_only: "Chỉ xem DS",
};
const ROLE_DESC: Record<UserRole, string> = {
  admin:      "Toàn quyền",
  viewer:     "Xem mọi trang",
  teams_only: "Chỉ Chi Tiết DS",
};
const ROLE_BADGE: Record<UserRole, "danger" | "brand" | "neutral"> = {
  admin:      "danger",
  viewer:     "brand",
  teams_only: "neutral",
};
const ROLE_ICON: Record<UserRole, React.ElementType> = {
  admin:      Shield,
  viewer:     Eye,
  teams_only: BarChart2,
};
const ROLE_COLOR: Record<UserRole, string> = {
  admin:      "bg-red-600/20 border-red-500/50 text-red-300",
  viewer:     "bg-blue-600/20 border-blue-500/50 text-blue-300",
  teams_only: "bg-purple-600/20 border-purple-500/50 text-purple-300",
};

const emptyForm = { name: "", email: "", password: "", role: "viewer" as UserRole };

function formatLastLogin(iso: string | undefined): string {
  if (!iso) return "Chưa đăng nhập";
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60)    return "Vừa xong";
  if (diff < 3600)  return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} ngày trước`;
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function UsersClient({
  initialUsers,
  lastLoginMap,
}: {
  initialUsers: User[];
  lastLoginMap: Record<string, string>;
}) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<UserRole | "all">("all");
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const filtered = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "all" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  function openAdd() {
    setEditUser(null);
    setForm(emptyForm);
    setError("");
    setShowModal(true);
  }

  function openEdit(u: User) {
    setEditUser(u);
    setForm({ name: u.name, email: u.email, password: "••••••", role: u.role });
    setError("");
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.email.trim()) {
      setError("Vui lòng điền đầy đủ Họ Tên và Tài khoản");
      return;
    }
    if (!editUser && !form.password.trim()) {
      setError("Vui lòng nhập mật khẩu");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (editUser) {
        const res = await fetch("/api/users", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editUser.id, ...form }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setUsers(prev => prev.map(u => u.id === editUser.id
          ? { ...u, name: form.name, email: form.email, role: form.role, avatar: form.name[0].toUpperCase() }
          : u
        ));
      } else {
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setUsers(prev => [...prev, { ...json.user, password: form.password }]);
      }
      setShowModal(false);
    } catch (e: any) {
      setError(e.message || "Lỗi lưu dữ liệu");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch("/api/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (e: any) {
      alert(e.message || "Không thể xóa");
    }
    setDeleteConfirm(null);
  }

  const stats = {
    total:      users.length,
    admins:     users.filter(u => u.role === "admin").length,
    viewers:    users.filter(u => u.role === "viewer").length,
    teamsOnly:  users.filter(u => u.role === "teams_only").length,
  };

  return (
    <div>
      <Header title="Quản Lý User">
        <Button variant="primary" size="sm" onClick={openAdd}>
          <UserPlus size={14} /> Thêm User
        </Button>
      </Header>

      <div className="p-6">
        <PageHeader title="Quản Lý User" subtitle="Tạo, cấp quyền và quản lý tài khoản người dùng" />

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Tổng Users",      value: stats.total,     color: "text-white",      bg: "border-slate-700/50" },
            { label: "Quản Trị",        value: stats.admins,    color: "text-red-400",    bg: "border-red-500/20" },
            { label: "Xem toàn bộ",     value: stats.viewers,   color: "text-blue-400",   bg: "border-blue-500/20" },
            { label: "Chỉ xem DS",      value: stats.teamsOnly, color: "text-purple-400", bg: "border-purple-500/20" },
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
                  placeholder="Tìm theo tên hoặc tài khoản..."
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-300 placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex gap-2">
                {(["all", "admin", "viewer", "teams_only"] as const).map((r) => (
                  <button key={r} onClick={() => setFilterRole(r)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      filterRole === r ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-400 hover:text-white"
                    }`}>
                    {r === "all" ? "Tất cả" : ROLE_LABELS[r as UserRole]}
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
                const isAdmin = user.role === "admin";
                return (
                  <div key={user.id}
                    className="flex items-center gap-4 bg-slate-900/40 rounded-lg px-4 py-3.5 hover:bg-slate-900/60 transition-colors group">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${
                      isAdmin ? "bg-gradient-to-br from-red-600 to-red-800"
                      : user.role === "teams_only" ? "bg-gradient-to-br from-purple-600 to-purple-800"
                      : "bg-gradient-to-br from-blue-600 to-blue-800"
                    }`}>
                      {user.avatar || user.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white text-sm font-medium">{user.name}</span>
                        <Badge variant={ROLE_BADGE[user.role]}>
                          <RoleIcon size={10} className="mr-1" />
                          {ROLE_LABELS[user.role]}
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 font-mono">{user.email}</div>
                    </div>
                    <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 min-w-fit">
                      <Clock size={11} className="text-slate-600" />
                      <span>{formatLastLogin(lastLoginMap[user.email])}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(user)}
                        className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                        <Edit2 size={13} />
                      </button>
                      {deleteConfirm === user.id ? (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-red-400">Xóa?</span>
                          <button onClick={() => handleDelete(user.id)}
                            className="p-1.5 text-green-400 hover:bg-green-400/10 rounded-lg">
                            <Check size={13} />
                          </button>
                          <button onClick={() => setDeleteConfirm(null)}
                            className="p-1.5 text-slate-400 hover:bg-slate-400/10 rounded-lg">
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        !isAdmin && (
                          <button onClick={() => setDeleteConfirm(user.id)}
                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                            <Trash2 size={13} />
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-sm">Không tìm thấy user nào</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add / Edit modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-white">
                {editUser ? "Chỉnh Sửa User" : "Thêm User Mới"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {[
                { label: "Họ Tên",    key: "name",     placeholder: "Nguyễn Văn A", type: "text"     },
                { label: "Tài khoản", key: "email",    placeholder: "ten.dang.nhap", type: "text"    },
                { label: "Mật Khẩu",  key: "password", placeholder: editUser ? "Để trống nếu không đổi" : "••••••••", type: "password" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-sm text-slate-400 mb-1.5">{f.label}</label>
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    value={(form as any)[f.key]}
                    onChange={(e) => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              ))}

              <div>
                <label className="block text-sm text-slate-400 mb-2">Quyền Truy Cập</label>
                <div className="grid grid-cols-1 gap-2">
                  {(["admin", "viewer", "teams_only"] as UserRole[]).map((r) => {
                    const Icon = ROLE_ICON[r];
                    const active = form.role === r;
                    return (
                      <button key={r} type="button"
                        onClick={() => setForm(prev => ({ ...prev, role: r }))}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-sm font-medium transition-all text-left ${
                          active ? ROLE_COLOR[r] : "border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-300"
                        }`}>
                        <Icon size={15} className="flex-shrink-0" />
                        <div className="flex-1">
                          <div className="font-semibold">{ROLE_LABELS[r]}</div>
                          <div className="text-xs opacity-70 font-normal mt-0.5">{ROLE_DESC[r]}</div>
                        </div>
                        {active && <Check size={14} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {error && (
                <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1 justify-center">
                Hủy
              </Button>
              <Button variant="primary" onClick={handleSave} disabled={saving} className="flex-1 justify-center">
                {saving
                  ? <><Loader2 size={14} className="animate-spin" /> Đang lưu...</>
                  : editUser
                    ? <><Check size={14} /> Lưu thay đổi</>
                    : <><UserPlus size={14} /> Tạo User</>
                }
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
