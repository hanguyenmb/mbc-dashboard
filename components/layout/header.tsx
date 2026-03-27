"use client";

import { Bell, Sun, Moon, Search } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function Header({ title, subtitle, children }: HeaderProps) {
  const [dark, setDark] = useState(true);

  return (
    <header className="h-16 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm flex items-center px-6 gap-4 sticky top-0 z-30">
      {/* Search */}
      <div className="flex-1 flex items-center gap-3">
        <div className="relative max-w-xs w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            placeholder="Tìm kiếm..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-300 placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50"
          />
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {children}
        <button
          onClick={() => setDark(!dark)}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
        >
          {dark ? <Moon size={16} /> : <Sun size={16} />}
        </button>
        <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors relative">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>
      </div>
    </header>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-slate-400 text-sm mt-0.5">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
