from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from io import BytesIO
import openpyxl
from database import get_db
from models import User, PayrollEntry
from auth import get_current_user

router = APIRouter(prefix="/api/payroll", tags=["payroll"])

class HourlyPayrollIn(BaseModel):
    worker_name: str; period_start: str; period_end: str; hours_worked: float; hourly_rate: float

class SalariedPayrollIn(BaseModel):
    worker_name: str; period_start: str; period_end: str; monthly_salary: float

class PayrollOut(BaseModel):
    id: int; worker_name: str; worker_type: str; period_start: str; period_end: str
    hours_worked: Optional[float]; hourly_rate: Optional[float]; monthly_salary: Optional[float]; total_pay: float
    class Config:
        from_attributes = True

@router.post("/hourly", response_model=PayrollOut, status_code=201)
def add_hourly(data: HourlyPayrollIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    entry = PayrollEntry(worker_name=data.worker_name, worker_type="hourly", period_start=data.period_start, period_end=data.period_end, hours_worked=data.hours_worked, hourly_rate=data.hourly_rate, total_pay=round(data.hours_worked * data.hourly_rate, 2), created_by=user.id)
    db.add(entry); db.commit(); db.refresh(entry); return entry

@router.post("/salaried", response_model=PayrollOut, status_code=201)
def add_salaried(data: SalariedPayrollIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    entry = PayrollEntry(worker_name=data.worker_name, worker_type="salaried", period_start=data.period_start, period_end=data.period_end, monthly_salary=data.monthly_salary, total_pay=data.monthly_salary, created_by=user.id)
    db.add(entry); db.commit(); db.refresh(entry); return entry

@router.get("", response_model=list[PayrollOut])
def list_payroll(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(PayrollEntry).order_by(PayrollEntry.period_start.desc()).all()

@router.delete("/{entry_id}", status_code=204)
def delete_entry(entry_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    entry = db.query(PayrollEntry).filter(PayrollEntry.id == entry_id).first()
    if not entry: raise HTTPException(status_code=404, detail="Not found")
    db.delete(entry); db.commit()

@router.get("/export")
def export_payroll(period_start: str = None, period_end: str = None, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    q = db.query(PayrollEntry)
    if period_start: q = q.filter(PayrollEntry.period_start >= period_start)
    if period_end: q = q.filter(PayrollEntry.period_end <= period_end)
    entries = q.order_by(PayrollEntry.period_start).all()
    wb = openpyxl.Workbook(); ws = wb.active; ws.title = "Payroll"
    ws.append(["Worker Name","Type","Period Start","Period End","Hours","Rate (£)","Salary (£)","Total Pay (£)"])
    for e in entries: ws.append([e.worker_name, e.worker_type, e.period_start, e.period_end, e.hours_worked, e.hourly_rate, e.monthly_salary, e.total_pay])
    buf = BytesIO(); wb.save(buf); buf.seek(0)
    return StreamingResponse(buf, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers={"Content-Disposition": 'attachment; filename="Payroll_Export.xlsx"'})
