"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, PageHeader } from "@/components/ui/Card";
import clsx from "clsx";

const MONTH_NAMES = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function MoMBadge({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-xs text-text-muted">—</span>;
  const up = pct >= 0;
  return <span className={clsx("text-xs font-medium", up ? "text-success" : "text-danger")}>{up ? "▲" : "▼"} {Math.abs(pct)}%</span>;
}

function KPICard({ label, value, prev, mom, format }: any) {
  return (
    <Card className="p-5">
      <p className="text-xs font-medium text-text-muted uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-semibold text-text mt-2">{format(value)}</p>
      <div className="flex items-center gap-2 mt-1.5">
        <span className="text-xs text-text-muted">Prev: {format(prev)}</span>
        <MoMBadge pct={mom} />
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [availableMonths, setAvailableMonths] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    api.get("/dashboard/available-months").then((r) => {
      setAvailableMonths(r.data);
      if (r.data.length > 0) setSelected(r.data[0]);
    });
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    api.get(`/dashboard/kpis?year=${selected.year}&month=${selected.month}`).then((r) => setData(r.data)).finally(() => setLoading(false));
  }, [selected]);

  const fmt = {
    currency: (n: number) => `£${n.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
    hours: (n: number) => `${n.toFixed(0)}h`,
    integer: (n: number) => String(n),
  };

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-start justify-between mb-6">
        <PageHeader title="Executive Dashboard" subtitle="Key performance metrics" />
        {availableMonths.length > 0 && (
          <select className="text-sm border border-primary/40 bg-bg rounded-lg px-3 py-2 text-text focus:outline-none" value={selected ? `${selected.year}-${selected.month}` : ""} onChange={(e) => { const [y,m] = e.target.value.split("-").map(Number); setSelected({year:y,month:m}); }}>
            {availableMonths.map((a) => <option key={`${a.year}-${a.month}`} value={`${a.year}-${a.month}`}>{MONTH_NAMES[a.month]} {a.year}</option>)}
          </select>
        )}
      </div>
      {loading ? <p className="text-text-muted text-sm">Loading…</p> : !data ? <p className="text-text-muted text-sm">No data. Upload a SureCare export first.</p> : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KPICard label="Revenue" value={data.current.revenue} prev={data.previous.revenue} mom={data.mom.revenue} format={fmt.currency} />
            <KPICard label="Care Hours" value={data.current.care_hours} prev={data.previous.care_hours} mom={data.mom.care_hours} format={fmt.hours} />
            <KPICard label="Active Clients" value={data.current.active_clients} prev={data.previous.active_clients} mom={data.mom.active_clients} format={fmt.integer} />
            <KPICard label="Active Care Workers" value={data.current.active_workers} prev={data.previous.active_workers} mom={data.mom.active_workers} format={fmt.integer} />
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card className="p-5"><p className="text-xs font-medium text-text-muted uppercase tracking-wide">Gross Margin</p><p className="text-2xl font-semibold text-text mt-2">{fmt.currency(data.current.gross_margin)}</p><p className="text-sm text-text-muted mt-1">{data.current.gross_margin_pct}% margin</p></Card>
            <Card className="p-5"><p className="text-xs font-medium text-text-muted uppercase tracking-wide">Care Worker Cost</p><p className="text-2xl font-semibold text-text mt-2">{fmt.currency(data.current.revenue - data.current.gross_margin)}</p></Card>
          </div>
        </>
      )}
    </div>
  );
}
