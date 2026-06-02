"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Card, PageHeader } from "@/components/ui/Card";
import { isAdmin } from "@/lib/auth";
import clsx from "clsx";

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email:"", password:"", full_name:"", role:"standard" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (!isAdmin()) { router.replace("/dashboard"); return; } load(); }, []);
  function load() { api.get("/auth/users").then((r) => setUsers(r.data)); }

  async function createUser(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError("");
    try { await api.post("/auth/users", form); setForm({ email:"",password:"",full_name:"",role:"standard" }); setShowForm(false); load(); }
    catch (err: any) { setError(err.response?.data?.detail || "Failed to create user."); }
    finally { setSaving(false); }
  }

  async function toggleActive(user: any) {
    const endpoint = user.is_active ? `/auth/users/${user.id}/deactivate` : `/auth/users/${user.id}/activate`;
    await api.patch(endpoint); load();
  }

  return (
    <div className="p-8 max-w-3xl">
      <PageHeader title="User Management" subtitle="Create and manage platform users" />
      <Card className="mb-5">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-primary/20 bg-bg/60"><th className="text-left px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Name</th><th className="text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Email</th><th className="text-center px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Role</th><th className="text-center px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wide">Status</th><th className="px-4 py-3" /></tr></thead>
          <tbody className="divide-y divide-primary/10">
            {users.map((u) => (
              <tr key={u.id} className={clsx(!u.is_active && "opacity-50")}>
                <td className="px-5 py-3.5 font-medium text-text">{u.full_name}</td>
                <td className="px-4 py-3.5 text-text-muted">{u.email}</td>
                <td className="px-4 py-3.5 text-center"><span className={clsx("text-xs px-2.5 py-1 rounded-full font-medium", u.role==="admin" ? "bg-accent/15 text-accent" : "bg-primary/30 text-text-muted")}>{u.role}</span></td>
                <td className="px-4 py-3.5 text-center"><span className={clsx("text-xs px-2.5 py-1 rounded-full font-medium", u.is_active ? "bg-success/15 text-success" : "bg-danger/10 text-danger")}>{u.is_active ? "Active" : "Inactive"}</span></td>
                <td className="px-4 py-3.5 text-right"><button onClick={() => toggleActive(u)} className="text-xs text-text-muted hover:text-danger hover:underline">{u.is_active ? "Deactivate" : "Activate"}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      {!showForm ? (
        <button onClick={() => setShowForm(true)} className="text-sm text-accent hover:underline font-medium">+ Create new user</button>
      ) : (
        <Card className="p-5">
          <p className="text-sm font-medium text-text mb-4">New user</p>
          <form onSubmit={createUser} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="text-xs text-text-muted mb-1 block">Full name</label><input required value={form.full_name} onChange={(e) => setForm({...form,full_name:e.target.value})} className="w-full text-sm border border-primary/40 bg-bg rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/30" /></div>
            <div><label className="text-xs text-text-muted mb-1 block">Email</label><input required type="email" value={form.email} onChange={(e) => setForm({...form,email:e.target.value})} className="w-full text-sm border border-primary/40 bg-bg rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/30" /></div>
            <div><label className="text-xs text-text-muted mb-1 block">Password</label><input required type="password" value={form.password} onChange={(e) => setForm({...form,password:e.target.value})} className="w-full text-sm border border-primary/40 bg-bg rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/30" /></div>
            <div><label className="text-xs text-text-muted mb-1 block">Role</label><select value={form.role} onChange={(e) => setForm({...form,role:e.target.value})} className="w-full text-sm border border-primary/40 bg-bg rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/30"><option value="standard">Standard</option><option value="admin">Admin</option></select></div>
            {error && <p className="sm:col-span-2 text-sm text-danger bg-danger/10 px-3 py-2 rounded-lg">{error}</p>}
            <div className="sm:col-span-2 flex gap-2"><button type="submit" disabled={saving} className="flex-1 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 disabled:opacity-60">{saving?"Creating…":"Create User"}</button><button type="button" onClick={() => {setShowForm(false);setError("");}} className="flex-1 py-2 border border-primary/40 rounded-lg text-sm text-text-muted">Cancel</button></div>
          </form>
        </Card>
      )}
    </div>
  );
}
