"use client";

import { useState, useEffect } from "react";
import { X, History, ChevronDown, ChevronUp, Trash2 } from "lucide-react";

export interface AiHistoryEntry {
  id: string;
  timestamp: number;
  contextLabel: string;
  analysis: string;
}

const STORAGE_KEY = "mbc_ai_history";

export function loadHistory(): AiHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveHistory(entry: AiHistoryEntry) {
  const list = loadHistory();
  list.unshift(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 20))); // giữ tối đa 20
}

interface AiHistoryPanelProps {
  onClose: () => void;
}

export function AiHistoryPanel({ onClose }: AiHistoryPanelProps) {
  const [entries, setEntries] = useState<AiHistoryEntry[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    setEntries(loadHistory());
  }, []);

  function deleteEntry(id: string) {
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  function clearAll() {
    setEntries([]);
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-lg bg-slate-900 border-l border-slate-700 flex flex-col h-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-700/50 border border-slate-600 rounded-lg flex items-center justify-center">
              <History size={14} className="text-slate-300" />
            </div>
            <div>
              <div className="text-white font-semibold text-sm">Lịch Sử AI</div>
              <div className="text-xs text-slate-400">{entries.length} phân tích đã lưu</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {entries.length > 0 && (
              <button onClick={clearAll} className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-400/10 transition-colors">
                Xóa tất cả
              </button>
            )}
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
              <History size={32} className="opacity-30" />
              <p className="text-sm">Chưa có lịch sử phân tích</p>
            </div>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-700/50 transition-colors"
                  onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
                >
                  <div>
                    <div className="text-sm font-medium text-white">{entry.contextLabel}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {new Date(entry.timestamp).toLocaleString("vi-VN")}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteEntry(entry.id); }}
                      className="p-1 text-slate-600 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                    {expanded === entry.id ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                  </div>
                </div>
                {expanded === entry.id && (
                  <div className="px-4 pb-4 border-t border-slate-700/50">
                    <div className="text-slate-300 text-xs leading-relaxed whitespace-pre-wrap mt-3">
                      {entry.analysis}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
