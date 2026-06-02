"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, PageHeader } from "@/components/ui/Card";
import { isAdmin } from "@/lib/auth";
import clsx from "clsx";

const MONTH_NAMES=["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const STATUS_ICON:Record<string,string>={on_target:"🟢",close:"🟡",below:"🔴"};
const STATUS_LABEL:Record<string,string>={on_target:"On Target",close:"Close",below:"Below Target"};

function Var({n}:{n:number}){const sign=n>=0?"+":"";return <span className={n>=0?"text-success":"text-danger"}>{sign}£{Math.abs(n).toLocaleString("en-GB",{minimumFractionDigits:0})}</span>;}

export default function ManagersPage(){
  const now=new Date();
  const [year,setYear]=useState(now.getFullYear());
  const [month,setMonth]=useState(now.getMonth()+1);
  const [rows,setRows]=useState<any[]>([]);
  const [assignments,setAssignments]=useState<any[]>([]);
  const [knownClients,setKnownClients]=useState<string[]>([]);
  const [showTargetForm,setShowTargetForm]=useState(false);
  const [showAssignForm,setShowAssignForm]=useState(false);
  const [targetForm,setTargetForm]=useState({manager_name:"",target_hours:"",target_revenue:""});
  const [assignForm,setAssignForm]=useState({service_user_no:"",manager_name:""});
  const [activeTab,setActiveTab]=useState<"performance"|"assignments">("performance");
  const admin=isAdmin();

  function loadPerf(){api.get(`/managers/performance?year=${year}&month=${month}`).then((r)=>setRows(r.data));}
  function loadAssignments(){api.get("/managers/assignments").then((r)=>setAssignments(r.data));api.get("/managers/clients").then((r)=>setKnownClients(r.data));}

  useEffect(()=>{loadPerf();},[year,month]);
  useEffect(()=>{loadAssignments();},[]);

  async function submitTarget(e:React.FormEvent){
    e.preventDefault();
    await api.post("/managers/targets",{manager_name:targetForm.manager_name,year_num:year,month_num:month,target_hours:parseFloat(targetForm.target_hours)||0,target_revenue:parseFloat(targetForm.target_revenue)||0});
    setTargetForm({manager_name:"",target_hours:"",target_revenue:""});setShowTargetForm(false);loadPerf();
  }

  async function submitAssign(e:React.FormEvent){
    e.preventDefault();await api.post("/managers/assignments",assignForm);
    setAssignForm({service_user_no:"",manager_name:""});setShowAssignForm(false);loadAssignments();
  }

  async function deleteAssignment(id:number){await api.delete(`/managers/assignments/${id}`);loadAssignments();}

  return(
    <div className="p-8 max-w-5xl">
      <div className="flex items-start justify-between mb-6">
        <PageHeader title="Manager Performance" subtitle="KPI targets vs actuals" />
        <div className="flex gap-2 items-center">
          <select className="text-sm border border-primary/40 bg-bg rounded-lg px-3 py-2 focus:outline-none" value={month} onChange={(e)=>setMonth(Number(e.target.value))}>
            {MONTH_NAMES.slice(1).map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <input type="number" value={year} onChange={(e)=>setYear(Number(e.target.value))} className="text-sm border border-primary/40 bg-bg rounded-lg px-3 py-2 w-24 focus:outline-none" />
        </div>
      </div>
      <div className="flex gap-1 mb-5 bg-primary/20 rounded-xl p-1 w-fit">
        {(["performance","assignments"] as const).map((t)=>(
          <button key={t} onClick={()=>setActiveTab(t)} className={clsx("px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition",activeTab===t?"bg-card text-text shadow-sm":"text-text-muted")}>
            {t==="performance"?"Performance":"Client Assignments"}
          </button>
        ))}
      </div>
      {activeTab==="performance"&&(
        <>
          <Card className="mb-4">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-primary/20 bg-bg/60"><th className="text-left px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Manager</th><th className="text-right px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Target Rev</th><th className="text-right px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Actual Rev</th><th className="text-right px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Variance</th><th className="text-right px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Achievement</th><th className="text-center px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Status</th></tr></thead>
              <tbody className="divide-y divide-primary/10">
                {rows.length===0&&<tr><td colSpan={6} className="px-5 py-4 text-text-muted text-sm">No targets set.</td></tr>}
                {rows.map((r)=>(
                  <tr key={r.manager_name}>
                    <td className="px-5 py-3.5 font-medium text-text">{r.manager_name}</td>
                    <td className="px-4 py-3.5 text-right text-text">£{r.target_revenue.toLocaleString("en-GB",{minimumFractionDigits:0})}</td>
                    <td className="px-4 py-3.5 text-right text-text font-medium">£{r.actual_revenue.toLocaleString("en-GB",{minimumFractionDigits:0})}</td>
                    <td className="px-4 py-3.5 text-right"><Var n={r.revenue_variance} /></td>
                    <td className="px-4 py-3.5 text-right"><div className="flex items-center justify-end gap-1.5"><div className="w-20 bg-primary/20 rounded-full h-1.5"><div className={clsx("h-1.5 rounded-full",r.status==="on_target"?"bg-success":r.status==="close"?"bg-warning":"bg-danger")} style={{width:`${Math.min(r.revenue_achievement_pct,100)}%`}} /></div><span className="text-xs text-text-muted w-10 text-right">{r.revenue_achievement_pct}%</span></div></td>
                    <td className="px-4 py-3.5 text-center text-xs">{STATUS_ICON[r.status]} {STATUS_LABEL[r.status]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          {admin&&(!showTargetForm?<button onClick={()=>setShowTargetForm(true)} className="text-sm text-accent hover:underline font-medium">+ Set / update target</button>:(
            <Card className="p-5"><form onSubmit={submitTarget} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div><label className="text-xs text-text-muted mb-1 block">Manager name</label><input required value={targetForm.manager_name} onChange={(e)=>setTargetForm({...targetForm,manager_name:e.target.value})} className="w-full text-sm border border-primary/40 bg-bg rounded-lg px-3 py-2 focus:outline-none" /></div>
              <div><label className="text-xs text-text-muted mb-1 block">Target revenue (£)</label><input type="number" step="100" required value={targetForm.target_revenue} onChange={(e)=>setTargetForm({...targetForm,target_revenue:e.target.value})} className="w-full text-sm border border-primary/40 bg-bg rounded-lg px-3 py-2 focus:outline-none" /></div>
              <div><label className="text-xs text-text-muted mb-1 block">Target hours</label><input type="number" value={targetForm.target_hours} onChange={(e)=>setTargetForm({...targetForm,target_hours:e.target.value})} className="w-full text-sm border border-primary/40 bg-bg rounded-lg px-3 py-2 focus:outline-none" /></div>
              <div className="flex gap-2"><button type="submit" className="flex-1 py-2 bg-accent text-white rounded-lg text-sm font-medium">Save</button><button type="button" onClick={()=>setShowTargetForm(false)} className="flex-1 py-2 border border-primary/40 rounded-lg text-sm text-text-muted">Cancel</button></div>
            </form></Card>
          ))}
        </>
      )}
      {activeTab==="assignments"&&(
        <>
          <Card className="mb-4">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-primary/20 bg-bg/60"><th className="text-left px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Client Code</th><th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Manager</th>{admin&&<th className="px-4 py-3" />}</tr></thead>
              <tbody className="divide-y divide-primary/10">
                {assignments.length===0&&<tr><td colSpan={3} className="px-5 py-4 text-text-muted text-sm">No assignments. Assign clients to managers so actuals can be calculated.</td></tr>}
                {assignments.map((a)=>(<tr key={a.id}><td className="px-5 py-3.5 font-mono text-text font-medium">{a.service_user_no}</td><td className="px-4 py-3.5 text-text">{a.manager_name}</td>{admin&&<td className="px-4 py-3.5 text-right"><button onClick={()=>deleteAssignment(a.id)} className="text-xs text-danger hover:underline">Remove</button></td>}</tr>))}
              </tbody>
            </table>
          </Card>
          {admin&&(!showAssignForm?<button onClick={()=>setShowAssignForm(true)} className="text-sm text-accent hover:underline font-medium">+ Assign client to manager</button>:(
            <Card className="p-5"><form onSubmit={submitAssign} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div><label className="text-xs text-text-muted mb-1 block">Client code</label><select required value={assignForm.service_user_no} onChange={(e)=>setAssignForm({...assignForm,service_user_no:e.target.value})} className="w-full text-sm border border-primary/40 bg-bg rounded-lg px-3 py-2 focus:outline-none"><option value="">Select client…</option>{knownClients.map((c)=><option key={c} value={c}>{c}</option>)}</select></div>
              <div><label className="text-xs text-text-muted mb-1 block">Manager name</label><input required value={assignForm.manager_name} onChange={(e)=>setAssignForm({...assignForm,manager_name:e.target.value})} className="w-full text-sm border border-primary/40 bg-bg rounded-lg px-3 py-2 focus:outline-none" /></div>
              <div className="flex gap-2"><button type="submit" className="flex-1 py-2 bg-accent text-white rounded-lg text-sm font-medium">Assign</button><button type="button" onClick={()=>setShowAssignForm(false)} className="flex-1 py-2 border border-primary/40 rounded-lg text-sm text-text-muted">Cancel</button></div>
            </form></Card>
          ))}
        </>
      )}
    </div>
  );
}
