
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import select
from .database import Base, engine, get_db
from .models import JobPosting, Course, Recommendation
from .schemas import ReviewRequest
from .seed import seed_if_empty
from .services.intelligence import analyze

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    from .database import SessionLocal
    db = SessionLocal()
    try:
        seed_if_empty(db)
    finally:
        db.close()
    yield

app = FastAPI(title="MahaSkill Intelligence API", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

@app.get("/api/health")
def health():
    return {"status": "ok", "data_mode": "synthetic_demo"}

@app.get("/api/filters")
def filters(db: Session = Depends(get_db)):
    jobs = db.scalars(select(JobPosting)).all()
    return {
        "districts": sorted({j.district for j in jobs}),
        "sectors": sorted({j.sector for j in jobs}),
        "data_mode": "synthetic_demo"
    }

@app.get("/api/overview")
def overview(district: str | None = None, sector: str | None = None, db: Session = Depends(get_db)):
    result = analyze(db, district, sector)
    total_jobs = len(result["jobs"])
    total_courses = len(result["courses"])
    return {
        "district": district or "All districts", "sector": sector or "All sectors",
        "job_postings": total_jobs, "courses": total_courses,
        "skills_detected": len(result["demand"]), "potential_gaps": len(result["gaps"]),
        "recommendations": len(result["recommendations"]), "data_mode": "synthetic_demo"
    }

@app.get("/api/demand")
def demand(district: str | None = None, sector: str | None = None, db: Session = Depends(get_db)):
    return analyze(db, district, sector)["demand"]

@app.get("/api/gaps")
def gaps(district: str | None = None, sector: str | None = None, db: Session = Depends(get_db)):
    return analyze(db, district, sector)["gaps"]

@app.get("/api/recommendations")
def recommendations(district: str | None = None, sector: str | None = None, db: Session = Depends(get_db)):
    return analyze(db, district, sector)["recommendations"]

@app.get("/api/jobs")
def jobs(district: str | None = None, sector: str | None = None, db: Session = Depends(get_db)):
    q = select(JobPosting)
    if district: q = q.where(JobPosting.district == district)
    if sector: q = q.where(JobPosting.sector == sector)
    rows = db.scalars(q).all()
    return [{"id": j.id, "title": j.title, "district": j.district, "sector": j.sector,
             "posted_date": j.posted_date, "description": j.description, "source": j.source} for j in rows]

@app.get("/api/courses")
def courses(district: str | None = None, sector: str | None = None, db: Session = Depends(get_db)):
    q = select(Course)
    if district: q = q.where(Course.district == district)
    if sector: q = q.where(Course.sector == sector)
    rows = db.scalars(q).all()
    return [{"id": c.id, "name": c.name, "district": c.district, "sector": c.sector,
             "qualification": c.qualification, "seats": c.seats, "trainers": c.trainers,
             "equipment_notes": c.equipment_notes} for c in rows]

@app.post("/api/review/{recommendation_id}")
def review(recommendation_id: int, payload: ReviewRequest, db: Session = Depends(get_db)):
    rec = db.get(Recommendation, recommendation_id)
    if rec is None:
        raise HTTPException(status_code=404, detail="Recommendation record not found. Demo recommendations are computed dynamically in v1.")
    rec.status = payload.status
    db.commit()
    return {"id": rec.id, "status": rec.status}
