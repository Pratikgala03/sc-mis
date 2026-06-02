from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean,
    DateTime, ForeignKey, UniqueConstraint,
)
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, default="standard")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Upload(Base):
    __tablename__ = "uploads"
    id = Column(Integer, primary_key=True)
    file_name = Column(String, nullable=False)
    upload_type = Column(String, nullable=False)
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="processing")
    error_message = Column(String, nullable=True)
    rows_imported = Column(Integer, default=0)
    uploader = relationship("User")


class Visit(Base):
    __tablename__ = "visits"
    __table_args__ = (
        UniqueConstraint("service_user_no", "care_worker", "time_off_call", name="uq_visit"),
    )
    id = Column(Integer, primary_key=True)
    upload_id = Column(Integer, ForeignKey("uploads.id"), nullable=True)
    service_user_no = Column(String, nullable=False, index=True)
    care_worker = Column(String, nullable=False, index=True)
    week = Column(Integer)
    time_off_call = Column(String, nullable=False)
    visit_date = Column(String, nullable=False, index=True)
    month_num = Column(Integer, nullable=False, index=True)
    year_num = Column(Integer, nullable=False, index=True)
    day_num = Column(Integer, nullable=False)
    duration_hrs = Column(Float, default=0)
    care_worker_pay = Column(Float, default=0)
    service_user_billing = Column(Float, default=0)
    is_cancelled = Column(Boolean, default=False)


class KPITarget(Base):
    __tablename__ = "kpi_targets"
    __table_args__ = (
        UniqueConstraint("manager_name", "year_num", "month_num", name="uq_kpi_target"),
    )
    id = Column(Integer, primary_key=True)
    manager_name = Column(String, nullable=False)
    year_num = Column(Integer, nullable=False)
    month_num = Column(Integer, nullable=False)
    target_hours = Column(Float, default=0)
    target_revenue = Column(Float, default=0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ManagerClientAssignment(Base):
    __tablename__ = "manager_client_assignments"
    __table_args__ = (
        UniqueConstraint("service_user_no", name="uq_client_manager"),
    )
    id = Column(Integer, primary_key=True)
    service_user_no = Column(String, nullable=False, index=True)
    manager_name = Column(String, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class MISReportLog(Base):
    __tablename__ = "mis_report_log"
    id = Column(Integer, primary_key=True)
    year_num = Column(Integer, nullable=False)
    month_num = Column(Integer, nullable=False)
    generated_at = Column(DateTime, default=datetime.utcnow)
    generated_by = Column(Integer, ForeignKey("users.id"))
    generator = relationship("User")


class PayrollEntry(Base):
    __tablename__ = "payroll_entries"
    id = Column(Integer, primary_key=True)
    worker_name = Column(String, nullable=False)
    worker_type = Column(String, nullable=False)
    period_start = Column(String, nullable=False)
    period_end = Column(String, nullable=False)
    hours_worked = Column(Float, nullable=True)
    hourly_rate = Column(Float, nullable=True)
    monthly_salary = Column(Float, nullable=True)
    total_pay = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"))
