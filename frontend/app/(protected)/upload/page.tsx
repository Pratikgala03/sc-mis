"use client";
import { useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import { Card, PageHeader } from "@/components/ui/Card";
import clsx from "clsx";

const UPLOAD_TYPES = [
  { value: "surecare", label: "SureCare Weekly Export", hint: "CSV or XLSX from SureCare Finance Analysis" },
  { value: "payroll_dates", label: "Payroll Dates File", hint: "CSV of payroll period dates" },
  { value: "kpi_targets", label: "KPI Targets File", hint: "CSV of manager targets" },
];

const STATUS_COLOUR: Record<string,string> = { success: "text-success bg-success/10", error: "text-danger bg-danger/10", processing: "text-warning bg-warning/10" };

export default function UploadPage() {
  const [uploadType, setUploadType] = useState("surecare");
  const [file, setFile] = useState<File|null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  function loadHistory() { api.get("/uploads").then((r) => setHistory(r.data)); }
  useEffect(() => { loadHistory(); }, []);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault(); if (!file) return;
    setUploading(true); setResult(null);
    const form = new FormData(); form.append("file", file); form.append("upload_type", uploadType);
    try {
      const { data } = await api.post("/uploads", form);
      setResult({ type: "ok", message: data.message }); setFile(null);
      if (inputRef.current) inputRef.current.value = ""; loadHistory();
    } catch (err: any) { setResult({ type: "err", message: err.response?.data?.detail || "Upload failed." }); }
    finally { setUploading(false); }
  }

  return (
    <div className="p-8 max-w-3xl">
      <PageHeader title="Data Upload" subtitle="Upload SureCare exports and reference files" />
      <Card className="p-6 mb-6">
        <form onSubmit={handleUpload} className="space-y-5">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {UPLOAD_TYPES.map((t) => (
              <button key={t.value} type="button" onClick={() => setUploadType(t.value)} className={clsx("text-left p-3.5 rounded-xl border text-sm transition", uploadType===t.value ? "border-accent bg-accent/10 text-text" : "border-primary/30 hover:border-accent/40 text-text-muted")}>
                <p className="font-medium">{t.label}</p><p className="text-xs mt-0.5 opacity-70">{t.hint}</p>
              </button>
            ))}
          </div>
          <div className="border-2 border-dashed border-primary/40 rounded-xl p-6 text-center hover:border-accent/60 transition cursor-pointer" onClick={() => inputRef.current?.click()}>
            <input ref={inputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => setFile(e.target.files?.[0]||null)} />
            {file ? <p className="text-sm text-text font-medium">{file.name}</p> : <><p className="text-sm text-text-muted">Click to select file</p><p className="text-xs text-text-muted mt-1">CSV or XLSX</p></>}
          </div>
          {result && <p className={clsx("text-sm px-4 py-2.5 rounded-lg", result.type==="ok" ? "text-success bg-success/10" : "text-danger bg-danger/10")}>{result.message}</p>}
          <button type="submit" disabled={!file||uploading} className="w-full py-2.5 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 disabled:opacity-50 transition">{uploading ? "Uploading…" : "Upload & Process"}</button>
        </form>
      </Card>
      <Card>
        <div className="px-5 py-4 border-b border-primary/20"><p className="text-sm font-medium text-text">Upload History</p></div>
        {history.length === 0 ? <p className="text-sm text-text-muted px-5 py-4">No uploads yet.</p> : (
          <div className="divide-y divide-primary/10">
            {history.map((u) => (
              <div key={u.id} className="px-5 py-3.5 flex items-center justify-between gap-4">
                <div className="min-w-0"><p className="text-sm font-medium text-text truncate">{u.file_name}</p><p className="text-xs text-text-muted mt-0.5">{u.upload_type} · {u.uploader_name} · {new Date(u.uploaded_at).toLocaleDateString("en-GB")}{u.rows_imported>0&&` · ${u.rows_imported} rows`}</p></div>
                <span className={clsx("text-xs px-2.5 py-1 rounded-full font-medium shrink-0", STATUS_COLOUR[u.status]||"text-text-muted bg-primary/10")}>{u.status}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
