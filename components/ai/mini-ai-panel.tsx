"use client";

import { useState } from "react";
import { Sparkles, Loader2, RefreshCw, X, Copy, CheckCheck } from "lucide-react";

interface MiniAiPanelProps {
  context: string;
  data: any;
  label?: string;
}

export function MiniAiPanel({ context, data, label = "AI phân tích" }: MiniAiPanelProps) {
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState("");
  const [error, setError]     = useState("");
  const [copied, setCopied]   = useState(false);

  async function fetchAnalysis() {
    setLoading(true);
    setError("");
    setResult("");
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context, data }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Lỗi AI");
      setResult(json.analysis);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleClick() {
    if (open) { setOpen(false); return; }
    setOpen(true);
    if (!result) fetchAnalysis();
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="w-full">
      {/* Trigger */}
      <button
        onClick={handleClick}
        className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition-all border whitespace-nowrap flex-shrink-0 ${
          open
            ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
            : "bg-slate-700/40 text-slate-400 border-slate-600/40 hover:text-purple-300 hover:bg-purple-500/10 hover:border-purple-500/30"
        }`}
      >
        <Sparkles size={11} className={loading ? "animate-pulse text-purple-400" : ""} />
        {label}
      </button>

      {/* Inline panel */}
      {open && (
        <div className="mt-3 rounded-xl border border-purple-500/20 bg-purple-500/5 overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-purple-500/10">
            <div className="flex items-center gap-1.5 text-[11px] text-purple-400 font-medium">
              <Sparkles size={10} /> Gemini 2.5 Flash
            </div>
            <div className="flex items-center gap-0.5">
              {result && !loading && (
                <button onClick={handleCopy} className="p-1.5 text-slate-500 hover:text-slate-300 rounded transition-colors">
                  {copied ? <CheckCheck size={11} className="text-green-400" /> : <Copy size={11} />}
                </button>
              )}
              {result && (
                <button onClick={fetchAnalysis} disabled={loading} className="p-1.5 text-slate-500 hover:text-slate-300 rounded transition-colors">
                  <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1.5 text-slate-500 hover:text-slate-300 rounded transition-colors">
                <X size={11} />
              </button>
            </div>
          </div>

          {/* Panel body */}
          <div className="px-3 py-3 text-xs leading-relaxed">
            {loading && (
              <div className="flex items-center gap-2 text-slate-400 py-2">
                <Loader2 size={12} className="animate-spin text-purple-400" />
                <span>Gemini đang phân tích...</span>
              </div>
            )}
            {error && !loading && (
              <div className="text-red-400">
                <span className="font-medium">Lỗi: </span>{error}
                <button onClick={fetchAnalysis} className="ml-2 underline text-red-300 hover:text-red-200">Thử lại</button>
              </div>
            )}
            {result && !loading && (
              <div className="text-slate-300 whitespace-pre-wrap font-sans">{result}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
