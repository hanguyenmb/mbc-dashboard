"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, Loader2, RefreshCw, Copy, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AiAnalysisPanelProps {
  context: "overview" | "teams" | "personal";
  data: any;
  onClose: () => void;
}

const CONTEXT_LABELS = {
  overview: "Tổng Quan Công Ty",
  teams: "Báo Cáo Nhóm",
  personal: "Cá Nhân",
};

export function AiAnalysisPanel({ context, data, onClose }: AiAnalysisPanelProps) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function runAnalysis() {
    setLoading(true);
    setError("");
    setAnalysis("");
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context, data }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Lỗi AI");
      setAnalysis(json.analysis);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    runAnalysis();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function copyToClipboard() {
    await navigator.clipboard.writeText(analysis);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="w-full max-w-lg bg-slate-900 border-l border-slate-700 flex flex-col h-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-600/20 border border-purple-500/30 rounded-lg flex items-center justify-center">
              <Sparkles size={14} className="text-purple-400" />
            </div>
            <div>
              <div className="text-white font-semibold text-sm">Phân Tích AI</div>
              <div className="text-xs text-slate-400">{CONTEXT_LABELS[context]}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {analysis && (
              <Button variant="ghost" size="sm" onClick={copyToClipboard}>
                {copied ? <CheckCheck size={13} className="text-green-400" /> : <Copy size={13} />}
                {copied ? "Đã copy" : "Copy"}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={runAnalysis} disabled={loading}>
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </Button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
              <div className="relative">
                <div className="w-12 h-12 border-2 border-purple-500/30 rounded-full" />
                <Loader2 size={24} className="absolute inset-0 m-auto animate-spin text-purple-400" />
              </div>
              <div className="text-sm">Claude đang phân tích dữ liệu...</div>
              <div className="text-xs text-slate-600">Vui lòng chờ vài giây</div>
            </div>
          )}

          {error && !loading && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
              <div className="font-medium mb-1">Lỗi kết nối AI</div>
              <div className="text-xs opacity-80">{error}</div>
              <Button variant="outline" size="sm" className="mt-3" onClick={runAnalysis}>
                <RefreshCw size={12} /> Thử lại
              </Button>
            </div>
          )}

          {analysis && !loading && (
            <div className="prose prose-invert prose-sm max-w-none">
              <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                {analysis}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-700 flex items-center gap-2">
          <Sparkles size={12} className="text-purple-400" />
          <span className="text-xs text-slate-500">Powered by Gemini 2.5 Flash</span>
        </div>
      </div>
    </div>
  );
}
