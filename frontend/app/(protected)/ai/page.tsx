"use client";
import { useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import { Card, PageHeader } from "@/components/ui/Card";
import clsx from "clsx";

const MONTH_NAMES = ["","Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const SUGGESTIONS = ["Summarise this month.","What is our gross margin?","How many active clients?","Compare to last month.","What are the main risks?"];

export default function AIPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [availableMonths, setAvailableMonths] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { api.get("/dashboard/available-months").then((r) => { setAvailableMonths(r.data); if (r.data.length > 0) setSelected(r.data[0]); }); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function ask(question: string) {
    if (!question.trim() || loading) return;
    setMessages((m) => [...m, { role: "user", text: question }]);
    setInput(""); setLoading(true);
    try {
      const { data } = await api.post("/ai/chat", { question, year: selected?.year, month: selected?.month });
      setMessages((m) => [...m, { role: "assistant", text: data.answer }]);
    } catch (err: any) {
      setMessages((m) => [...m, { role: "assistant", text: err.response?.data?.detail || "AI assistant unavailable." }]);
    } finally { setLoading(false); }
  }

  return (
    <div className="p-8 max-w-2xl flex flex-col" style={{ height: "calc(100vh - 0px)" }}>
      <div className="flex items-start justify-between mb-6">
        <PageHeader title="AI Assistant" subtitle="Ask questions about company performance" />
        {availableMonths.length > 0 && (
          <select className="text-sm border border-primary/40 bg-bg rounded-lg px-3 py-2 text-text focus:outline-none" value={selected ? `${selected.year}-${selected.month}` : ""} onChange={(e) => { const [y,m]=e.target.value.split("-").map(Number); setSelected({year:y,month:m}); }}>
            {availableMonths.map((a) => <option key={`${a.year}-${a.month}`} value={`${a.year}-${a.month}`}>{MONTH_NAMES[a.month]} {a.year}</option>)}
          </select>
        )}
      </div>
      <Card className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8"><p className="text-text-muted text-sm mb-4">Try asking:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {SUGGESTIONS.map((s) => <button key={s} onClick={() => ask(s)} className="text-xs border border-primary/40 rounded-full px-3 py-1.5 text-text-muted hover:bg-primary/20 hover:text-text transition">{s}</button>)}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={clsx("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div className={clsx("max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap", m.role === "user" ? "bg-accent text-white rounded-br-sm" : "bg-bg text-text border border-primary/30 rounded-bl-sm")}>{m.text}</div>
            </div>
          ))}
          {loading && <div className="flex justify-start"><div className="bg-bg border border-primary/30 rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-text-muted">Thinking…</div></div>}
          <div ref={bottomRef} />
        </div>
        <div className="border-t border-primary/20 p-4 flex gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key==="Enter"&&!e.shiftKey&&(e.preventDefault(),ask(input))} placeholder="Ask about performance, margins, clients…" className="flex-1 text-sm border border-primary/40 bg-bg rounded-lg px-3.5 py-2.5 text-text focus:outline-none focus:ring-2 focus:ring-accent/30" />
          <button onClick={() => ask(input)} disabled={!input.trim()||loading} className="px-4 py-2.5 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 disabled:opacity-50 transition">Send</button>
        </div>
      </Card>
    </div>
  );
}
