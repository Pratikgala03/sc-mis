import calendar
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database import get_db
from models import User, MISReportLog
from auth import get_current_user
from processing.mis_generator import generate_mis

router = APIRouter(prefix="/api/mis", tags=["mis"])
XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

@router.get("/generate")
def generate(year: int = Query(...), month: int = Query(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    buf = generate_mis(db, year, month)
    db.add(MISReportLog(year_num=year, month_num=month, generated_by=current_user.id))
    db.commit()
    month_name = calendar.month_name[month]
    filename = f"MIS_{month_name}_{year}.xlsx"
    return StreamingResponse(buf, media_type=XLSX_MIME, headers={"Content-Disposition": f'attachment; filename="{filename}"'})

@router.get("/history")
def history(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    logs = db.query(MISReportLog).order_by(MISReportLog.generated_at.desc()).limit(50).all()
    return [{"id": l.id, "year_num": l.year_num, "month_num": l.month_num, "generated_at": l.generated_at.isoformat(), "generated_by": l.generator.full_name if l.generator else "Unknown"} for l in logs]
