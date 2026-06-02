import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from database import engine, Base
from models import User
from auth import hash_password
from database import SessionLocal

from routers import auth, uploads, dashboard, mis, payroll, managers, ai_assistant

Base.metadata.create_all(bind=engine)

app = FastAPI(title="SC MIS", version="1.0.0")

raw_origins = os.getenv("CORS_ORIGINS", "*")
if raw_origins == "*":
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=raw_origins.split(","),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(auth.router)
app.include_router(uploads.router)
app.include_router(dashboard.router)
app.include_router(mis.router)
app.include_router(payroll.router)
app.include_router(managers.router)
app.include_router(ai_assistant.router)


@app.on_event("startup")
def seed_admin():
    db = SessionLocal()
    try:
        admin_email = os.getenv("ADMIN_EMAIL", "admin@scmis.com")
        admin_password = os.getenv("ADMIN_PASSWORD", "changeme123")
        if not db.query(User).filter(User.email == admin_email).first():
            db.add(User(
                email=admin_email,
                hashed_password=hash_password(admin_password),
                full_name="Admin",
                role="admin",
            ))
            db.commit()
    finally:
        db.close()


@app.get("/api/health")
def health():
    return {"status": "ok"}
