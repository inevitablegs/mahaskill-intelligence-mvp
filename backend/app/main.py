
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import select
from .database import Base, engine, get_db
from .models import District, Sector, DistrictIndicator, SourceDocument
from .models import JobPosting, Course, Recommendation
from .schemas import ReviewRequest
from .seed import seed_all
from .services.intelligence import (
    state_overview, analyze_district, full_mismatch_analysis,
    sector_cross_district, generate_training_plan,
    analyze, extract_and_store_skills,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    from .database import SessionLocal
    db = SessionLocal()
    try:
        seed_all(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title="MahaSkill Intelligence API",
    description="Labour-market intelligence and curriculum-alignment platform for Maharashtra",
    version="2.0.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health ─────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    return {"status": "ok", "version": "2.0.0", "data_mode": "mssds_real_indicators"}


# ── Real MSSDS Endpoints ──────────────────────────────────────

@app.get("/api/districts")
def list_districts(db: Session = Depends(get_db)):
    """List all 36 Maharashtra districts."""
    rows = db.scalars(select(District).order_by(District.district_name)).all()
    return [
        {
            "district_id": d.district_id,
            "district_name": d.district_name,
            "division": d.division,
            "state": d.state,
            "is_prototype": d.is_prototype,
        }
        for d in rows
    ]


@app.get("/api/sectors")
def list_sectors(db: Session = Depends(get_db)):
    """List all 41 sectors from MSSDS taxonomy."""
    rows = db.scalars(select(Sector).order_by(Sector.sector_name)).all()
    return [
        {
            "sector_id": s.sector_id,
            "sector_name": s.sector_name,
            "sector_group": s.sector_group,
            "review_status": s.review_status,
        }
        for s in rows
    ]


@app.get("/api/state-overview")
def get_state_overview(db: Session = Depends(get_db)):
    """State-level intelligence overview with district summaries."""
    return state_overview(db)


@app.get("/api/district-profile")
def get_district_profile(
    district_id: str = Query(..., description="e.g. D001"),
    db: Session = Depends(get_db),
):
    """Full sector-by-sector analysis for a district."""
    district = db.scalar(select(District).where(District.district_id == district_id))
    if not district:
        raise HTTPException(404, f"District {district_id} not found")
    return analyze_district(db, district_id)


@app.get("/api/mismatch-analysis")
def get_mismatch_analysis(
    district_id: str | None = Query(None, description="Optional filter"),
    db: Session = Depends(get_db),
):
    """Demand-supply mismatch analysis across all districts or a single district."""
    return full_mismatch_analysis(db, district_id)


@app.get("/api/training-plan")
def get_training_plan(
    district_id: str = Query(..., description="e.g. D001"),
    db: Session = Depends(get_db),
):
    """Recommended training plan with priority ranking."""
    district = db.scalar(select(District).where(District.district_id == district_id))
    if not district:
        raise HTTPException(404, f"District {district_id} not found")
    return generate_training_plan(db, district_id)


@app.get("/api/sector-intelligence")
def get_sector_intelligence(
    sector_id: str = Query(..., description="e.g. SEC_IT"),
    db: Session = Depends(get_db),
):
    """Cross-district comparison for a single sector."""
    sector = db.scalar(select(Sector).where(Sector.sector_id == sector_id))
    if not sector:
        raise HTTPException(404, f"Sector {sector_id} not found")
    return sector_cross_district(db, sector_id)


# ── Legacy Demo Endpoints (backward compatibility) ────────────

@app.get("/api/filters")
def filters(db: Session = Depends(get_db)):
    jobs = db.scalars(select(JobPosting)).all()
    return {
        "districts": sorted({j.district for j in jobs}),
        "sectors": sorted({j.sector for j in jobs}),
        "data_mode": "synthetic_demo",
    }


@app.get("/api/overview")
def overview(
    district: str | None = None,
    sector: str | None = None,
    db: Session = Depends(get_db),
):
    result = analyze(db, district, sector)
    total_jobs = len(result["jobs"])
    total_courses = len(result["courses"])
    return {
        "district": district or "All districts",
        "sector": sector or "All sectors",
        "job_postings": total_jobs,
        "courses": total_courses,
        "skills_detected": len(result["demand"]),
        "potential_gaps": len(result["gaps"]),
        "recommendations": len(result["recommendations"]),
        "data_mode": "synthetic_demo",
    }


@app.get("/api/demand")
def demand(
    district: str | None = None,
    sector: str | None = None,
    db: Session = Depends(get_db),
):
    return analyze(db, district, sector)["demand"]


@app.get("/api/gaps")
def gaps(
    district: str | None = None,
    sector: str | None = None,
    db: Session = Depends(get_db),
):
    return analyze(db, district, sector)["gaps"]


@app.get("/api/recommendations")
def recommendations(
    district: str | None = None,
    sector: str | None = None,
    db: Session = Depends(get_db),
):
    return analyze(db, district, sector)["recommendations"]


@app.get("/api/jobs")
def jobs(
    district: str | None = None,
    sector: str | None = None,
    db: Session = Depends(get_db),
):
    q = select(JobPosting)
    if district:
        q = q.where(JobPosting.district == district)
    if sector:
        q = q.where(JobPosting.sector == sector)
    rows = db.scalars(q).all()
    return [
        {
            "id": j.id,
            "title": j.title,
            "district": j.district,
            "sector": j.sector,
            "posted_date": j.posted_date,
            "description": j.description,
            "source": j.source,
        }
        for j in rows
    ]


@app.get("/api/courses")
def courses(
    district: str | None = None,
    sector: str | None = None,
    db: Session = Depends(get_db),
):
    q = select(Course)
    if district:
        q = q.where(Course.district == district)
    if sector:
        q = q.where(Course.sector == sector)
    rows = db.scalars(q).all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "district": c.district,
            "sector": c.sector,
            "qualification": c.qualification,
            "seats": c.seats,
            "trainers": c.trainers,
            "equipment_notes": c.equipment_notes,
        }
        for c in rows
    ]


@app.post("/api/review/{recommendation_id}")
def review(recommendation_id: int, payload: ReviewRequest, db: Session = Depends(get_db)):
    rec = db.get(Recommendation, recommendation_id)
    if rec is None:
        raise HTTPException(404, "Recommendation record not found.")
    rec.status = payload.status
    db.commit()
    return {"id": rec.id, "status": rec.status}
