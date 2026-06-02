"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { setAuth } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const form = new URLSearchParams();
      form.append("username", email); form.append("password", password);
      const { data } = await api.post("/auth/login", form, { headers: { "Content-Type": "application/x-www-form-urlencoded" } });
      setAuth(data.access_token, data.user);
      router.push("/dashboard");
    } catch { setError("Invalid email or password."); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent mb-4">
            <span className="text-white font-bold text-lg">SC</span>
          </div>
          <h1 className="text-2xl font-semibold text-text">SureCare MIS</h1>
          <p className="text-text-muted text-sm mt-1">Chelsea & Fulham</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-card rounded-2xl shadow-sm border border-primary/30 p-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg border border-primary/50 bg-bg text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition" placeholder="you@company.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text mb-1.5">Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg border border-primary/50 bg-bg text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition" placeholder="••••••••" />
          </div>
          {error && <p className="text-danger text-sm bg-danger/10 px-3 py-2 rounded-lg">{error}</p>}
          <button type="submit" disabled={loading} className="w-full py-2.5 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 disabled:opacity-60 transition">
            {loading ? "Signing in…" : "Sign in"}
          </button>
          <p className="text-center text-xs text-text-muted">Forgot password? Contact your administrator.</p>
        </form>
      </div>
    </div>
  );
}
