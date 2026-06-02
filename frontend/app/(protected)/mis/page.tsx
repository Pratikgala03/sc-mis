"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, PageHeader } from "@/components/ui/Card";

const MONTH_NAMES = ["","January","February","March","April","May","June","July","August","September","October","November","December"];

export default function MISPage() {
  const [availableMonths, setAvailableMonths] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [history, setHistory] = useState<any[]>([]);

  function loadHistory() { api.get("/mis/history").then((r) => setHistory(r.data)); }

  useEffect(() => {
    api.get("/dashboard/available-months").then((r) => { setAvailableMonths(r.data); if (r.data.length > 0) setSelected(r.data[0]); });
    loadHistory();
  }, []);

  async function generate() {
    if (!selected) return;
    setGenerating(true); setError(""); setSuccess("");
    try {
      const response = await api.get(`/mis/generate?year=${selected.year}&month=${selected.month}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement("a"); a.href = url;
      a.download = `MIS_${MONTH_NAMES[selected.month]}_${selected.year}.xlsx`; a.click();
      window.URL.revokeObjectURL(url);
      setSuccess(`MIS report downloaded.`); loadHistory();
    } catch { setError("Failed. Ensure visit data has been uploaded for this month."); }
    finally { setGenerating(false); }
  }

  return (
    <div className="p-8 max-w-2xl">
      <PageHeader title="MIS Generator" subtitle="Generate the monthly management report" />
      <Card className="p-6 space-y-5 mb-6">
        <div>
          <label className="block text-sm font-medium text-text mb-2">Select Month</label>
          {availableMonths.length === 0 ? <p className="text-sm text-text-muted">No data uploaded yet.</p> : (
            <select className="w-full text-sm border border-primary/40 bg-bg rounded-lg px-3 py-2.5 text-text focus:outline-none" value={selected ? `${selected.year}-${selected.month}` : ""} onChange={(e) => { const [y,m]=e.target.value.split("-").map(Number); setSelected({year:y,month:m}); }}>
              {availableMonths.map((a) => <option key={`${a.year}-${a.month}`} value={`${a.year}-${a.month}`}>{MONTH_NAMES[a.month]} {a.year}</option>)}
            </select>
          )}
        </div>
        {error && <p className="text-sm text-danger bg-danger/10 px-3 py-2.5 rounded-lg">{error}</p>}
        {success && <p className="text-sm text-success bg-success/10 px-3 py-2.5 rounded-lg">✓ {success}</p>}
        <button onClick={generate} disabled={!selected||generating||availableMonths.length===0} className="w-full py-2.5 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 disabled:opacity-50 transition">
          {generating ? "Generating…" : selected ? `Generate ${MONTH_NAMES[selected.month]} ${selected.year} MIS` : "Select a month"}
        </button>
      </Card>
      <Card>
        <div className="px-5 py-4 border-b border-primary/20"><p className="text-sm font-medium text-text">Generation History</p></div>
        {history.length === 0 ? <p className="text-sm text-text-muted px-5 py-4">No reports generated yet.</p> : (
          <div className="divide-y divide-primary/10">
            {history.map((h) => (
              <div key={h.id} className="px-5 py-3 flex items-center justify-between">
                <div><p className="text-sm font-medium text-text">{MONTH_NAMES[h.month_num]} {h.year_num}</p><p className="text-xs text-text-muted mt-0.5">{h.generated_by} · {new Date(h.generated_at).toLocaleString("en-GB")}</p></div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
