"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  UserCircle,
  Database,
  BarChart3,
  Trophy,
  Settings,
  Upload,
  LogOut,
  Network,
} from "lucide-react";
import { signOut } from "next-auth/react";
import type { UserRole } from "@/lib/types";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard",         label: "Tổng Quan",        icon: LayoutDashboard, roles: ["admin", "viewer"] },
  { href: "/dashboard/teams",   label: "Chi Tiết Doanh Số",icon: Users,           roles: ["admin", "viewer", "teams_only"] },
  { href: "/dashboard/weekly",  label: "Báo Cáo Tuần",     icon: BarChart3,       roles: ["admin", "viewer"] },
  { href: "/dashboard/ranking", label: "Bảng Xếp Hạng",    icon: Trophy,          roles: ["admin"] },
  { href: "/dashboard/import",  label: "Nhập Dữ Liệu",     icon: Upload,          roles: ["admin"] },
  { href: "/dashboard/users",   label: "Quản Lý User",     icon: Settings,        roles: ["admin"] },
];

// Phase 2 - Odoo API (not yet active)
const PHASE2_ITEMS = [
  { label: "Kết Nối Odoo API", icon: Network },
];

interface SidebarProps {
  role: UserRole;
  userName: string;
  userAvatar: string;
}

export function Sidebar({ role, userName, userAvatar }: SidebarProps) {
  const pathname = usePathname();

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-slate-900 border-r border-slate-700/50 flex flex-col z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-700/50">
        <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/30">
          MB
        </div>
        <div>
          <div className="text-white font-semibold text-sm leading-tight">BZ MBC Dashboard</div>
          <div className="text-slate-400 text-xs">v1.2</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 mb-2">
          Dashboard
        </div>
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150",
                active
                  ? "bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/50"
              )}
            >
              <Icon size={16} className="flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}

        {/* Phase 2 section */}
        {role === "admin" && (
          <>
            <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-2 mt-5 mb-2">
              Giai Đoạn 2
            </div>
            {PHASE2_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-600 cursor-not-allowed select-none"
                >
                  <Icon size={16} />
                  {item.label}
                  <span className="ml-auto text-xs bg-slate-700 text-slate-500 px-1.5 py-0.5 rounded">
                    Soon
                  </span>
                </div>
              );
            })}
          </>
        )}
      </nav>

      {/* User info */}
      <div className="border-t border-slate-700/50 p-3">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-700/30 transition-colors">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {userAvatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-medium truncate">{userName}</div>
            <div className="text-slate-400 text-xs capitalize">
              {role === "admin" ? "Quản trị" : role === "teams_only" ? "Xem DS" : "Xem"}
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "https://dashboard.ha.com.vn/login" })}
            className="text-slate-500 hover:text-red-400 transition-colors p-1"
            title="Đăng xuất"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
