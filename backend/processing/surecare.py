import re
from io import BytesIO
from typing import BinaryIO
import pandas as pd

REQUIRED_COLUMNS = {"Service User No","Care Worker","Week","Time Off Call","Duration (Hrs)","Care Worker Pay","Service User Billing"}
DATE_RE = re.compile(r"(\d{2}-\d{2}-\d{4})")

def _parse_date(time_off_call):
    m = DATE_RE.search(str(time_off_call))
    if not m: return None
    day, month, year = m.group(1).split("-")
    return f"{year}-{month}-{day}"

def process_file(file: BinaryIO, filename: str) -> list[dict]:
    content = file.read()
    if filename.lower().endswith(".csv"):
        df = pd.read_csv(BytesIO(content))
    elif filename.lower().endswith((".xlsx", ".xls")):
        df = pd.read_excel(BytesIO(content))
    else:
        raise ValueError("Unsupported file type. Upload CSV or XLSX.")
    missing = REQUIRED_COLUMNS - set(df.columns)
    if missing:
        raise ValueError(f"Missing columns: {', '.join(missing)}")
    records = []; errors = []
    for idx, row in df.iterrows():
        time_off_call = str(row["Time Off Call"]).strip()
        visit_date = _parse_date(time_off_call)
        if not visit_date:
            errors.append(f"Row {idx+2}: cannot parse date from '{time_off_call}'")
            continue
        year, month, day = visit_date.split("-")
        is_cancelled = time_off_call.endswith("(c)")
        try:
            duration = float(row["Duration (Hrs)"])
            cw_pay = float(row["Care Worker Pay"])
            billing = float(row["Service User Billing"])
        except (ValueError, TypeError) as exc:
            errors.append(f"Row {idx+2}: numeric error - {exc}"); continue
        records.append({"service_user_no": str(row["Service User No"]).strip(), "care_worker": str(row["Care Worker"]).strip(), "week": int(row["Week"]) if pd.notna(row["Week"]) else 0, "time_off_call": time_off_call, "visit_date": visit_date, "month_num": int(month), "year_num": int(year), "day_num": int(day), "duration_hrs": duration, "care_worker_pay": cw_pay, "service_user_billing": billing, "is_cancelled": is_cancelled})
    if errors:
        for e in errors[:10]: print(f"  {e}")
    return records
