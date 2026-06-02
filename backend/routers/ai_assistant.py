import os, calendar
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from openai import OpenAI
from database import get_db
from models import User, Visit, KPITarget, ManagerClientAssignment
from auth import get_current_user

router = APIRouter(prefix="/api/ai", tags=["ai"])

class ChatRequest(BaseModel):
    question: str; year: int | None = None; month: int | None = None

def _build_context(db, year, month):
    month_name = calendar.month_name[month]
    revenue = db.query(func.sum(Visit.service_user_billing)).filter(Visit.year_num==year,Visit.month_num==month).scalar() or 0
    worker_cost = db.query(func.sum(Visit.care_worker_pay)).filter(Visit.year_num==year,Visit.month_num==month).scalar() or 0
    care_hours = db.query(func.sum(Visit.duration_hrs)).filter(Visit.year_num==year,Visit.month_num==month,Visit.is_cancelled==False).scalar() or 0
    active_clients = db.query(func.count(func.distinct(Visit.service_user_no))).filter(Visit.year_num==year,Visit.month_num==month).scalar() or 0
    active_workers = db.query(func.count(func.distinct(Visit.care_worker))).filter(Visit.year_num==year,Visit.month_num==month,Visit.care_worker!="Not Assigned").scalar() or 0
    gross_margin = revenue - worker_cost
    margin_pct = round(gross_margin/revenue*100,1) if revenue else 0
    pm,py = (month-1,year) if month>1 else (12,year-1)
    prev_revenue = db.query(func.sum(Visit.service_user_billing)).filter(Visit.year_num==py,Visit.month_num==pm).scalar() or 0
    targets = db.query(KPITarget).filter(KPITarget.year_num==year,KPITarget.month_num==month).all()
    prev_month_name = calendar.month_name[pm]
    ctx = f"Company: SureCare Chelsea & Fulham\nReport period: {month_name} {year}\n\nKEY METRICS\n- Revenue: £{revenue:,.2f} | Prev ({prev_month_name}): £{prev_revenue:,.2f}\n- Worker Cost: £{worker_cost:,.2f}\n- Gross Margin: £{gross_margin:,.2f} ({margin_pct}%)\n- Care Hours: {care_hours:.1f}h\n- Active Clients: {active_clients}\n- Active Care Workers: {active_workers}\n"
    if targets:
        ctx += "\nMANAGER TARGETS\n"
        for t in targets: ctx += f"  - {t.manager_name}: target £{t.target_revenue:,.0f}, {t.target_hours:.0f}h\n"
    return ctx.strip()

@router.post("/chat")
def chat(req: ChatRequest, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key: raise HTTPException(status_code=503, detail="AI assistant not configured. Set OPENAI_API_KEY.")
    from datetime import datetime
    now = datetime.utcnow(); year = req.year or now.year; month = req.month or now.month
    context = _build_context(db, year, month)
    client = OpenAI(api_key=api_key)
    response = client.chat.completions.create(model="gpt-4o-mini", messages=[{"role":"system","content":"You are a business analyst for a UK domiciliary care company. Answer using only the data provided. Be short and executive-friendly."},{"role":"user","content":f"DATA:\n{context}\n\nQUESTION: {req.question}"}], temperature=0.2, max_tokens=400)
    return {"answer": response.choices[0].message.content.strip()}
