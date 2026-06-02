"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, PageHeader } from "@/components/ui/Card";
import clsx from "clsx";

type Tab = "hourly" | "salaried";

function fmt(n: number) { return `£${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }

export default function PayrollPage() {
  const [tab, setTab] = useState<Tab>("hourly");
  const [entries, setEntries] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [filterStart, setFilterStart] = useState("");
  const [filterEnd, setFilterEnd] = useState("");
  const [form, setForm] = useState({ worker_name:"", period_start:"", period_end:"", hours_worked:"", hourly_rate:"", monthly_salary:"" });

  function load() { api.get("/payroll").then((r) => setEntries(r.data)); }
  useEffect(() => { load(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (tab === "hourly") {
      await api.post("/payroll/hourly", { worker_name: form.worker_name, period_start: form.period_start, period_end: form.period_end, hours_worked: parseFloat(form.hours_worked), hourly_rate: parseFloat(form.hourly_rate) });
    } else {
      await api.post("/payroll/salaried", { worker_name: form.worker_name, period_start: form.period_start, period_end: form.period_end, monthly_salary: parseFloat(form.monthly_salary) });
    }
    setForm({ worker_name:"", period_start:"", period_end:"", hours_worked:"", hourly_rate:"", monthly_salary:"" });
    setShowForm(false); load();
  }

  async function deleteEntry(id: number) {
    if (!confirm("Remove this payroll entry?")) return;
    await api.delete(`/payroll/${id}`); load();
  }

  async function exportXlsx() {
    const params = new URLSearchParams();
    if (filterStart) params.append("period_start", filterStart);
    if (filterEnd) params.append("period_end", filterEnd);
    const res = await api.get(`/payroll/export?${params}`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement("a"); a.href = url; a.download = "Payroll_Export.xlsx"; a.click();
  }

  const filtered = entries.filter((e) => {
    if (e.worker_type !== tab) return false;
    if (filterStart && e.period_start < filterStart) return false;
    if (filterEnd && e.period_end > filterEnd) return false;
    return true;
  });

  const totalPay = filtered.reduce((s, e) => s + e.total_pay, 0);
  const totalHours = filtered.filter((e) => e.worker_type === "hourly").reduce((s, e) => s + (e.hours_worked || 0), 0);

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-start justify-between mb-6">
        <PageHeader title="Payroll" subtitle="Hourly and salaried staff" />
        <button onClick={exportXlsx} className="text-sm border border-primary/40 bg-bg rounded-lg px-4 py-2 text-text hover:bg-primary/20 transition">Export Excel</button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
        <Card className="p-4"><p className="text-xs text-text-muted uppercase tracking-wide font-medium">Total Pay</p><p className="text-xl font-semibold text-text mt-1">{fmt(totalPay)}</p><p className="text-xs text-text-muted mt-0.5">{filtered.length} entries</p></Card>
        {tab === "hourly" && <Card className="p-4"><p className="text-xs text-text-muted uppercase tracking-wide font-medium">Total Hours</p><p className="text-xl font-semibold text-text mt-1">{totalHours.toFixed(1)}h</p><p className="text-xs text-text-muted mt-0.5">{totalHours > 0 ? fmt(totalPay/totalHours)+"/h avg" : "—"}</p></Card>}
      </div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex gap-1 bg-primary/20 rounded-xl p-1">
          {(["hourly","salaried"] as Tab[]).map((t) => <button key={t} onClick={() => setTab(t)} className={clsx("px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition", tab===t?"bg-card text-text shadow-sm":"text-text-muted")}>{t}</button>)}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <label className="text-xs text-text-muted">From</label>
          <input type="date" value={filterStart} onChange={(e) => setFilterStart(e.target.value)} className="text-sm border border-primary/40 bg-bg rounded-lg px-3 py-1.5 focus:outline-none" />
          <label className="text-xs text-text-muted">To</label>
          <input type="date" value={filterEnd} onChange={(e) => setFilterEnd(e.target.value)} className="text-sm border border-primary/40 bg-bg rounded-lg px-3 py-1.5 focus:outline-none" />
          {(filterStart||filterEnd) && <button onClick={() => {setFilterStart("");setFilterEnd("");}} className="text-xs text-danger hover:underline">Clear</button>}
        </div>
      </div>
      <Card>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-primary/20 bg-bg/60"><th className="text-left px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Worker</th><th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Period</th>{tab==="hourly"&&<><th className="text-right px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Hours</th><th className="text-right px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Rate</th></>}{tab==="salaried"&&<th className="text-right px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Salary</th>}<th className="text-right px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Total Pay</th><th className="px-4 py-3" /></tr></thead>
          <tbody className="divide-y divide-primary/10">
            {filtered.length===0&&<tr><td colSpan={7} className="px-5 py-4 text-text-muted">No entries.</td></tr>}
            {filtered.map((e) => (<tr key={e.id} className="hover:bg-bg/40 transition"><td className="px-5 py-3.5 font-medium text-text">{e.worker_name}</td><td className="px-4 py-3.5 text-text-muted text-xs">{e.period_start} → {e.period_end}</td>{tab==="hourly"&&<><td className="px-4 py-3.5 text-right text-text">{e.hours_worked}h</td><td className="px-4 py-3.5 text-right text-text">£{e.hourly_rate}/h</td></>}{tab==="salaried"&&<td className="px-4 py-3.5 text-right text-text">{fmt(e.monthly_salary)}</td>}<td className="px-5 py-3.5 text-right font-semibold text-text">{fmt(e.total_pay)}</td><td className="px-4 py-3.5 text-right"><button onClick={() => deleteEntry(e.id)} className="text-xs text-danger hover:underline">Remove</button></td></tr>))}
            {filtered.length>0&&<tr className="bg-primary/10 font-semibold"><td colSpan={tab==="hourly"?4:3} className="px-5 py-3 text-sm text-text">Total ({filtered.length} entries)</td><td className="px-5 py-3 text-right text-text">{fmt(totalPay)}</td><td /></tr>}
          </tbody>
        </table>
      </Card>
      <div className="mt-4">
        {!showForm ? (<button onClick={() => setShowForm(true)} className="text-sm text-accent hover:underline font-medium">+ Add {tab} entry</button>) : (
          <Card className="p-5 mt-2">
            <p className="text-sm font-medium text-text mb-4">New {tab} entry</p>
            <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div><label className="text-xs text-text-muted mb-1 block">Worker name</label><input required value={form.worker_name} onChange={(e) => setForm({...form,worker_name:e.target.value})} className="w-full text-sm border border-primary/40 bg-bg rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/30" /></div>
              <div><label className="text-xs text-text-muted mb-1 block">Period start</label><input required type="date" value={form.period_start} onChange={(e) => setForm({...form,period_start:e.target.value})} className="w-full text-sm border border-primary/40 bg-bg rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/30" /></div>
              <div><label className="text-xs text-text-muted mb-1 block">Period end</label><input required type="date" value={form.period_end} onChange={(e) => setForm({...form,period_end:e.target.value})} className="w-full text-sm border border-primary/40 bg-bg rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/30" /></div>
              {tab==="hourly"?(<><div><label className="text-xs text-text-muted mb-1 block">Hours worked</label><input required type="number" step="0.5" value={form.hours_worked} onChange={(e) => setForm({...form,hours_worked:e.target.value})} className="w-full text-sm border border-primary/40 bg-bg rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/30" /></div><div><label className="text-xs text-text-muted mb-1 block">Hourly rate (£)</label><input required type="number" step="0.01" value={form.hourly_rate} onChange={(e) => setForm({...form,hourly_rate:e.target.value})} className="w-full text-sm border border-primary/40 bg-bg rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/30" /></div></>):(<div><label className="text-xs text-text-muted mb-1 block">Monthly salary (£)</label><input required type="number" step="0.01" value={form.monthly_salary} onChange={(e) => setForm({...form,monthly_salary:e.target.value})} className="w-full text-sm border border-primary/40 bg-bg rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/30" /></div>)}
              <div className="flex gap-2"><button type="submit" className="flex-1 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90">Save</button><button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 border border-primary/40 rounded-lg text-sm text-text-muted hover:bg-bg">Cancel</button></div>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
