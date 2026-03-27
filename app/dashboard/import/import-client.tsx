"use client";

import { useState, useRef } from "react";
import { Header, PageHeader } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { IMPORT_LOGS } from "@/lib/mock-data";
import {
  Upload, FileSpreadsheet, Image, CheckCircle2,
  AlertCircle, Clock, Trash2, Eye, Loader2,
} from "lucide-react";

type ImportMode = "excel" | "image" | null;

export function ImportClient({ userEmail }: { userEmail: string }) {
  const [mode, setMode] = useState<ImportMode>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setError(null);
    if (mode === "image") {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  }

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mode", mode || "excel");

      const res = await fetch("/api/import", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi khi xử lý file");
      setResult(data.summary);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  const statusIcon = {
    success: <CheckCircle2 size={14} className="text-green-400" />,
    partial: <AlertCircle size={14} className="text-amber-400" />,
    error: <AlertCircle size={14} className="text-red-400" />,
  };
  const statusBadge = {
    success: "success" as const,
    partial: "warning" as const,
    error: "danger" as const,
  };

  return (
    <div>
      <Header title="Nhập Dữ Liệu" />
      <div className="p-6">
        <PageHeader
          title="Nhập Dữ Liệu"
          subtitle="Upload file Excel hoặc ảnh báo cáo — AI sẽ tự đọc và phân tích"
        />

        {/* Mode selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => { setMode("excel"); reset(); }}
            className={`p-6 rounded-xl border-2 transition-all duration-200 text-left hover:-translate-y-0.5 ${
              mode === "excel"
                ? "border-blue-500 bg-blue-500/10"
                : "border-slate-700/50 bg-slate-800/40 hover:border-slate-600"
            }`}
          >
            <FileSpreadsheet size={28} className={mode === "excel" ? "text-blue-400" : "text-slate-400"} />
            <div className="mt-3 font-semibold text-white">Upload Excel</div>
            <div className="text-sm text-slate-400 mt-1">
              Hỗ trợ .xlsx, .xls — AI phân tích và nhập dữ liệu tự động
            </div>
          </button>

          <button
            onClick={() => { setMode("image"); reset(); }}
            className={`p-6 rounded-xl border-2 transition-all duration-200 text-left hover:-translate-y-0.5 ${
              mode === "image"
                ? "border-purple-500 bg-purple-500/10"
                : "border-slate-700/50 bg-slate-800/40 hover:border-slate-600"
            }`}
          >
            <Image size={28} className={mode === "image" ? "text-purple-400" : "text-slate-400"} />
            <div className="mt-3 font-semibold text-white">Upload Ảnh Báo Cáo</div>
            <div className="text-sm text-slate-400 mt-1">
              Chụp ảnh hoặc screenshot báo cáo — Claude Vision sẽ đọc số liệu
            </div>
          </button>
        </div>

        {/* Upload area */}
        {mode && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                {mode === "excel" ? "Upload File Excel" : "Upload Ảnh Báo Cáo"}
              </CardTitle>
              {file && (
                <Button variant="ghost" size="sm" onClick={reset}>
                  <Trash2 size={12} /> Xóa
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {!file ? (
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-700 rounded-xl cursor-pointer hover:border-slate-500 transition-colors bg-slate-900/30 hover:bg-slate-900/50">
                  <Upload size={28} className="text-slate-500 mb-3" />
                  <span className="text-slate-400 text-sm font-medium">
                    Kéo thả hoặc click để chọn file
                  </span>
                  <span className="text-slate-600 text-xs mt-1">
                    {mode === "excel" ? ".xlsx, .xls (tối đa 10MB)" : "PNG, JPG, WEBP (tối đa 5MB)"}
                  </span>
                  <input
                    ref={fileRef}
                    type="file"
                    className="hidden"
                    accept={mode === "excel" ? ".xlsx,.xls" : "image/*"}
                    onChange={handleFileChange}
                  />
                </label>
              ) : (
                <div className="space-y-4">
                  {/* File info */}
                  <div className="flex items-center gap-3 bg-slate-900/50 rounded-lg p-4">
                    {mode === "excel" ? (
                      <FileSpreadsheet size={24} className="text-green-400 flex-shrink-0" />
                    ) : (
                      <Image size={24} className="text-purple-400 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm font-medium truncate">{file.name}</div>
                      <div className="text-slate-400 text-xs">{(file.size / 1024).toFixed(1)} KB</div>
                    </div>
                    <CheckCircle2 size={16} className="text-green-400 flex-shrink-0" />
                  </div>

                  {/* Image preview */}
                  {preview && (
                    <div className="rounded-lg overflow-hidden border border-slate-700">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={preview} alt="Preview" className="w-full max-h-64 object-contain bg-slate-900" />
                    </div>
                  )}

                  <Button
                    variant="primary"
                    onClick={handleUpload}
                    disabled={loading}
                    className="w-full justify-center"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        AI đang phân tích...
                      </>
                    ) : (
                      <>
                        <Upload size={14} />
                        Phân Tích & Nhập Dữ Liệu
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Result */}
        {result && (
          <Card className="mb-6 border-green-500/30">
            <CardHeader>
              <CardTitle className="text-green-400">Kết Quả Phân Tích AI</CardTitle>
              <CheckCircle2 size={16} className="text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="bg-slate-900/50 rounded-lg p-4 text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
                {result}
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="mb-6 border-red-500/30">
            <CardContent className="pt-5">
              <div className="flex items-start gap-3 text-red-400 text-sm">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Import history */}
        <Card>
          <CardHeader>
            <CardTitle>Lịch Sử Nhập Dữ Liệu</CardTitle>
            <Clock size={14} className="text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {IMPORT_LOGS.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center gap-3 bg-slate-900/40 rounded-lg px-4 py-3 hover:bg-slate-900/60 transition-colors"
                >
                  {statusIcon[log.status]}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white font-medium truncate">{log.filename}</div>
                    <div className="text-xs text-slate-500">
                      {new Date(log.importedAt).toLocaleString("vi-VN")} · {log.importedBy}
                    </div>
                    {log.notes && (
                      <div className="text-xs text-amber-400 mt-0.5">{log.notes}</div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm text-slate-300">{log.rowCount} dòng</div>
                    <Badge variant={statusBadge[log.status]} className="mt-1">
                      {log.status === "success" ? "Thành công" : log.status === "partial" ? "Một phần" : "Lỗi"}
                    </Badge>
                  </div>
                  <button className="text-slate-500 hover:text-blue-400 transition-colors p-1">
                    <Eye size={14} />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
