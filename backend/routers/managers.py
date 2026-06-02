from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from datetime import datetime
from database import get_db
from models import User, KPITarget, Visit, ManagerClientAssignment
from auth import get_current_user, require_admin

router = APIRouter(prefix="/api/managers", tags=["managers"])

class KPITargetIn(BaseModel):
    manager_name: str; year_num: int; month_num: int; target_hours: float = 0; target_revenue: float = 0

class KPITargetOut(BaseModel):
    id: int; manager_name: str; year_num: int; month_num: int; target_hours: float; target_revenue: float
    class Config:
        from_attributes = True

class AssignmentIn(BaseModel):
    service_user_no: str; manager_name: str

class AssignmentOut(BaseModel):
    id: int; service_user_no: str; manager_name: str
    class Config:
        from_attributes = True

class ManagerPerformanceRow(BaseModel):
    manager_name: str; target_revenue: float; target_hours: float; actual_revenue: float; actual_hours: float
    revenue_variance: float; hours_variance: float; revenue_achievement_pct: float; hours_achievement_pct: float; status: str

def _status(pct):
    if pct >= 95: return "on_target"
    if pct >= 80: return "close"
    return "below"

def _actuals_for_manager(db, manager_name, year, month):
    assigned_rows = db.query(ManagerClientAssignment.service_user_no).filter(ManagerClientAssignment.manager_name==manager_name).all()
    codes = [r.service_user_no for r in assigned_rows]
    if not codes: return {"actual_revenue": 0.0, "actual_hours": 0.0}
    revenue = db.query(func.sum(Visit.service_user_billing)).filter(Visit.year_num==year, Visit.month_num==month, Visit.service_user_no.in_(codes)).scalar() or 0
    hours = db.query(func.sum(Visit.duration_hrs)).filter(Visit.year_num==year, Visit.month_num==month, Visit.service_user_no.in_(codes), Visit.is_cancelled==False).scalar() or 0
    return {"actual_revenue": round(float(revenue),2), "actual_hours": round(float(hours),2)}

@router.get("/performance", response_model=list[ManagerPerformanceRow])
def get_performance(year: int = Query(default=None), month: int = Query(default=None), db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    now = datetime.utcnow(); year = year or now.year; month = month or now.month
    targets = db.query(KPITarget).filter(KPITarget.year_num==year, KPITarget.month_num==month).all()
    rows = []
    for t in targets:
        actuals = _actuals_for_manager(db, t.manager_name, year, month)
        rev_pct = round(actuals["actual_revenue"]/t.target_revenue*100,1) if t.target_revenue else 0
        hrs_pct = round(actuals["actual_hours"]/t.target_hours*100,1) if t.target_hours else 0
        rows.append(ManagerPerformanceRow(manager_name=t.manager_name, target_revenue=t.target_revenue, target_hours=t.target_hours, actual_revenue=actuals["actual_revenue"], actual_hours=actuals["actual_hours"], revenue_variance=round(actuals["actual_revenue"]-t.target_revenue,2), hours_variance=round(actuals["actual_hours"]-t.target_hours,2), revenue_achievement_pct=rev_pct, hours_achievement_pct=hrs_pct, status=_status(rev_pct)))
    return rows

@router.get("/targets", response_model=list[KPITargetOut])
def list_targets(year: int = Query(default=None), month: int = Query(default=None), db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    now = datetime.utcnow(); year = year or now.year; month = month or now.month
    return db.query(KPITarget).filter(KPITarget.year_num==year, KPITarget.month_num==month).all()

@router.post("/targets", response_model=KPITargetOut, status_code=201)
def upsert_target(data: KPITargetIn, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    existing = db.query(KPITarget).filter(KPITarget.manager_name==data.manager_name, KPITarget.year_num==data.year_num, KPITarget.month_num==data.month_num).first()
    if existing:
        existing.target_hours = data.target_hours; existing.target_revenue = data.target_revenue
        db.commit(); db.refresh(existing); return existing
    target = KPITarget(**data.model_dump()); db.add(target); db.commit(); db.refresh(target); return target

@router.delete("/targets/{target_id}", status_code=204)
def delete_target(target_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    t = db.query(KPITarget).filter(KPITarget.id==target_id).first()
    if not t: raise HTTPException(status_code=404, detail="Not found")
    db.delete(t); db.commit()

@router.get("/assignments", response_model=list[AssignmentOut])
def list_assignments(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(ManagerClientAssignment).order_by(ManagerClientAssignment.manager_name).all()

@router.post("/assignments", response_model=AssignmentOut, status_code=201)
def upsert_assignment(data: AssignmentIn, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    existing = db.query(ManagerClientAssignment).filter(ManagerClientAssignment.service_user_no==data.service_user_no).first()
    if existing: existing.manager_name = data.manager_name; db.commit(); db.refresh(existing); return existing
    a = ManagerClientAssignment(**data.model_dump()); db.add(a); db.commit(); db.refresh(a); return a

@router.delete("/assignments/{assignment_id}", status_code=204)
def delete_assignment(assignment_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    a = db.query(ManagerClientAssignment).filter(ManagerClientAssignment.id==assignment_id).first()
    if not a: raise HTTPException(status_code=404, detail="Not found")
    db.delete(a); db.commit()

@router.get("/clients")
def known_clients(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    rows = db.query(Visit.service_user_no).distinct().all()
    return [r.service_user_no for r in rows]
