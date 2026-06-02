from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
from database import get_db
from models import User, Upload, Visit
from auth import get_current_user
from processing.surecare import process_file

router = APIRouter(prefix="/api/uploads", tags=["uploads"])

class UploadOut(BaseModel):
    id: int; file_name: str; upload_type: str; uploaded_at: datetime; status: str
    error_message: str | None; rows_imported: int; uploader_name: str | None
    class Config:
        from_attributes = True

@router.post("", status_code=201)
async def upload_file(file: UploadFile = File(...), upload_type: str = Form(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if upload_type not in ("surecare", "payroll_dates", "kpi_targets"):
        raise HTTPException(status_code=400, detail="Invalid upload_type")
    upload = Upload(file_name=file.filename, upload_type=upload_type, uploaded_by=current_user.id, status="processing")
    db.add(upload); db.commit(); db.refresh(upload)
    try:
        if upload_type == "surecare":
            records = process_file(file.file, file.filename)
            imported = skipped = 0
            for r in records:
                exists = db.query(Visit).filter(Visit.service_user_no==r["service_user_no"], Visit.care_worker==r["care_worker"], Visit.time_off_call==r["time_off_call"]).first()
                if exists: skipped += 1; continue
                db.add(Visit(upload_id=upload.id, **r)); imported += 1
            db.commit(); upload.status = "success"; upload.rows_imported = imported; db.commit()
            return {"id": upload.id, "status": "success", "rows_imported": imported, "rows_skipped": skipped, "message": f"Imported {imported} visits ({skipped} duplicates skipped)."}
        else:
            upload.status = "success"; db.commit()
            return {"id": upload.id, "status": "success", "message": "File received."}
    except ValueError as exc:
        upload.status = "error"; upload.error_message = str(exc); db.commit()
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        upload.status = "error"; upload.error_message = str(exc); db.commit()
        raise HTTPException(status_code=500, detail="Processing failed.")

@router.get("", response_model=list[UploadOut])
def list_uploads(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    rows = db.query(Upload).order_by(Upload.uploaded_at.desc()).limit(100).all()
    return [UploadOut(id=u.id, file_name=u.file_name, upload_type=u.upload_type, uploaded_at=u.uploaded_at, status=u.status, error_message=u.error_message, rows_imported=u.rows_imported, uploader_name=u.uploader.full_name if u.uploader else None) for u in rows]
