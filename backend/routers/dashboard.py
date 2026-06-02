from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from database import get_db
from models import User, Visit
from auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

def _kpi_for_month(db, year, month):
    revenue = db.query(func.sum(Visit.service_user_billing)).filter(Visit.year_num==year, Visit.month_num==month).scalar() or 0
    worker_cost = db.query(func.sum(Visit.care_worker_pay)).filter(Visit.year_num==year, Visit.month_num==month).scalar() or 0
    care_hours = db.query(func.sum(Visit.duration_hrs)).filter(Visit.year_num==year, Visit.month_num==month, Visit.is_cancelled==False).scalar() or 0
    active_clients = db.query(func.count(func.distinct(Visit.service_user_no))).filter(Visit.year_num==year, Visit.month_num==month).scalar() or 0
    active_workers = db.query(func.count(func.distinct(Visit.care_worker))).filter(Visit.year_num==year, Visit.month_num==month, Visit.care_worker!="Not Assigned").scalar() or 0
    gross_margin = revenue - worker_cost
    margin_pct = round(gross_margin / revenue * 100, 1) if revenue else 0
    return {"revenue": round(float(revenue),2), "worker_cost": round(float(worker_cost),2), "gross_margin": round(float(gross_margin),2), "gross_margin_pct": margin_pct, "care_hours": round(float(care_hours),2), "active_clients": int(active_clients), "active_workers": int(active_workers)}

@router.get("/kpis")
def get_kpis(year: int = Query(default=None), month: int = Query(default=None), db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    now = datetime.utcnow()
    year = year or now.year; month = month or now.month
    prev_month = month - 1; prev_year = year
    if prev_month == 0: prev_month = 12; prev_year -= 1
    current = _kpi_for_month(db, year, month)
    previous = _kpi_for_month(db, prev_year, prev_month)
    def mom_pct(curr, prev):
        if prev == 0: return None
        return round((curr - prev) / prev * 100, 1)
    return {"year": year, "month": month, "current": current, "previous": previous, "mom": {"revenue": mom_pct(current["revenue"], previous["revenue"]), "care_hours": mom_pct(current["care_hours"], previous["care_hours"]), "active_clients": mom_pct(current["active_clients"], previous["active_clients"]), "active_workers": mom_pct(current["active_workers"], previous["active_workers"]), "gross_margin": mom_pct(current["gross_margin"], previous["gross_margin"])}}

@router.get("/available-months")
def available_months(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    rows = db.query(Visit.year_num, Visit.month_num).distinct().order_by(Visit.year_num.desc(), Visit.month_num.desc()).all()
    return [{"year": r.year_num, "month": r.month_num} for r in rows]
