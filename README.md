# SC MIS — SureCare Chelsea & Fulham

Internal management information system. Upload SureCare exports → auto-generate MIS reports, KPIs, payroll, and AI insights.

## Quick Start (Local)

```bash
# Backend
cd backend && python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # edit SECRET_KEY
uvicorn main:app --reload --port 8000

# Frontend (new terminal)
cd frontend && npm install
cp .env.local.example .env.local
npm run dev
```

Open http://localhost:3000 · Login: admin@scmis.com / changeme123

## Deployment

See DEPLOY.md for Railway + Netlify setup.

## SureCare Export Format

The system expects the Finance Analysis CSV export with columns:
Service User No, Care Worker, Week, Time Off Call, Duration (Hrs), Care Worker Pay, Service User Billing

## Pages

- **Dashboard** — Revenue, care hours, clients, workers with MoM comparison
- **Data Upload** — Upload SureCare weekly exports (CSV/XLSX)
- **MIS Generator** — One-click Excel report matching existing layout
- **Managers** — KPI targets vs actuals, client assignments
- **Payroll** — Hourly and salaried staff calculations
- **AI Assistant** — Ask questions about performance in plain English
- **Users** — Create and manage platform users (admin only)

## Tech Stack

Backend: Python · FastAPI · SQLAlchemy · SQLite/PostgreSQL · Pandas · OpenPyXL · Anthropic
Frontend: Next.js 14 · TypeScript · Tailwind CSS
Deploy: Railway (backend) · Netlify (frontend)
