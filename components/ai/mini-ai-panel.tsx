"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Loader2, RefreshCw, X, Copy, CheckCheck } from "lucide-react";

const CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours

function cacheKey(context: string, data: any) {
  // Simple stable key: context + JSON of data (truncated)
  try {
    const str = context + JSON.stringify(data);
    let h = 0;
    for (let i = 0; i < str.length; i++) {
      h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    }
    return `ai_cache_${context}_${h}`;
  } catch {
    return `ai_cache_${context}`;
  }
}

function readCache(key: string): string | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { result, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) { localStorage.removeItem(key); return null; }
    return result;
  } catch { return null; }
}

function writeCache(key: string, result: string) {
  try { localStorage.setItem(key, JSON.stringify({ result, ts: Date.now() })); } catch {}
}

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
  const fetchingRef = useRef(false);
  const ck = cacheKey(context, data);

  // Load from cache on mount
  useEffect(() => {
    const cached = readCache(ck);
    if (cached) setResult(cached);
  }, [ck]);

  async function fetchAnalysis(force = false) {
    if (fetchingRef.current) return;
    const cached = readCache(ck);
    if (cached && !force) { setResult(cached); return; }
    fetchingRef.current = true;
    setLoading(true);
    setError("");
    if (force) setResult("");
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context, data }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Lỗi AI");
      setResult(json.analysis);
      writeCache(ck, json.analysis);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }

  // Pre-fetch on hover so result is ready when clicked
  function handleHover() {
    if (!result && !fetchingRef.current) fetchAnalysis();
  }

  function handleClick() {
    if (open) { setOpen(false); return; }
    setOpen(true);
    fetchAnalysis();
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const isCached = !!readCache(ck);

  return (
    <div className="w-full">
      {/* Trigger */}
      <button
        onClick={handleClick}
        onMouseEnter={handleHover}
        className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition-all border whitespace-nowrap flex-shrink-0 ${
          open
            ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
            : "bg-slate-700/40 text-slate-400 border-slate-600/40 hover:text-purple-300 hover:bg-purple-500/10 hover:border-purple-500/30"
        }`}
      >
        <Sparkles size={11} className={loading ? "animate-pulse text-purple-400" : ""} />
        {label}
        {isCached && !open && <span className="w-1.5 h-1.5 rounded-full bg-green-500/70 ml-0.5" title="Đã lưu cache" />}
      </button>

      {/* Inline panel */}
      {open && (
        <div className="mt-3 rounded-xl border border-purple-500/20 bg-purple-500/5 overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-purple-500/10">
            <div className="flex items-center gap-1.5 text-[11px] text-purple-400 font-medium">
              <Sparkles size={10} /> Gemini 2.5 Flash
              {isCached && <span className="text-[9px] text-green-400/70 font-normal ml-1">· từ cache</span>}
            </div>
            <div className="flex items-center gap-0.5">
              {result && !loading && (
                <button onClick={handleCopy} className="p-1.5 text-slate-500 hover:text-slate-300 rounded transition-colors">
                  {copied ? <CheckCheck size={11} className="text-green-400" /> : <Copy size={11} />}
                </button>
              )}
              {result && (
                <button onClick={() => fetchAnalysis(true)} disabled={loading} title="Làm mới" className="p-1.5 text-slate-500 hover:text-slate-300 rounded transition-colors">
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
                <button onClick={() => fetchAnalysis(true)} className="ml-2 underline text-red-300 hover:text-red-200">Thử lại</button>
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
