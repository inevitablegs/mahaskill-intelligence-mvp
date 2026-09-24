
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, Query, UploadFile, File
import pypdf
import io
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import select

from .database import Base, engine, get_db
from .models import (
    District, Sector, DistrictIndicator, SourceDocument,
    JobPosting, Course, Recommendation,
    JobRole, RoleSkill, Institute, LabEquipment,
    TrainerProfile, BatchPerformance, EmployerOutcome,
)
from .schemas import (
    ReviewRequest, SkillExtractionRequest, JobClassificationRequest,
    CandidateAssessmentRequest, CurriculumModernizationRequest,
    PolicySimulationRequest, EmployerFeedbackRequest, SetApiKeyRequest,
)
from .seed import seed_all
from .services.intelligence import (
    state_overview, analyze_district, full_mismatch_analysis,
    sector_cross_district, generate_training_plan,
    analyze, extract_and_store_skills,
    get_candidate_roles, assess_candidate,
    get_institute_overview, get_institute_course_recommendations,
    get_curriculum_updates, get_institute_trainers,
    get_institute_lab_gaps, get_batch_performance,
    get_government_kpis, simulate_policy,
    get_outcomes_intelligence,
)
from .services.gemini_nlp import (
    extract_skills_from_text,
    classify_job_description,
    analyze_curriculum_gap,
    generate_career_pathway,
    generate_policy_insights,
    is_gemini_available,
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
    description="AI-powered labour-market intelligence and curriculum-alignment platform for Maharashtra",
    version="3.0.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health & System Status ────────────────────────────────────

@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "version": "3.0.0",
        "data_mode": "mssds_real_indicators_v2",
        "gemini_active": is_gemini_available(),
    }


@app.post("/api/ai/set-key")
def set_gemini_key(payload: SetApiKeyRequest):
    """Set or update the Gemini API key dynamically."""
    import backend.app.services.gemini_nlp as gnlp
    gnlp.GEMINI_API_KEY = payload.api_key.strip()
    gnlp._model = None
    os.environ["GEMINI_API_KEY"] = payload.api_key.strip()
    return {"status": "updated", "gemini_active": is_gemini_available()}


# ── Real MSSDS Baseline Endpoints ─────────────────────────────

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


# ── AI / NLP Intelligence Layer (Gemini-Powered) ───────────────

@app.post("/api/ai/extract-skills")
def ai_extract_skills(payload: SkillExtractionRequest):
    """Extract and standardize skills from free text (resume, JD, syllabus)."""
    skills = extract_skills_from_text(payload.text, payload.sector_context)
    return {"skills": skills, "count": len(skills), "ai_powered": is_gemini_available()}


@app.post("/api/ai/classify-job")
def ai_classify_job(payload: JobClassificationRequest, db: Session = Depends(get_db)):
    """Classify free text job title/description into MSSDS Sector Taxonomy."""
    sectors = db.scalars(select(Sector.sector_name)).all()
    result = classify_job_description(payload.job_title, payload.job_description, sectors)
    return {**result, "ai_powered": is_gemini_available()}


@app.post("/api/ai/curriculum-gap")
def ai_curriculum_gap(payload: CurriculumModernizationRequest):
    """Detect curriculum gaps against emerging market technologies."""
    return analyze_curriculum_gap(
        course_name=payload.course_name,
        sector=payload.sector_name,
        current_topics=payload.current_topics,
    )


# ── 1. Candidates Portal Endpoints ────────────────────────────

@app.post("/api/candidate/upload-resume")
async def candidate_upload_resume(file: UploadFile = File(...)):
    """Extract text from uploaded resume PDF or TXT"""
    try:
        content = await file.read()
        if file.filename.endswith(".pdf"):
            reader = pypdf.PdfReader(io.BytesIO(content))
            text = "\n".join(page.extract_text() for page in reader.pages if page.extract_text())
        else:
            text = content.decode("utf-8", errors="ignore")
        return {"text": text}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process file: {str(e)}")


@app.get("/api/candidate/roles")
def candidate_roles(sector_id: str | None = None, db: Session = Depends(get_db)):
    """Get all mapped industry roles with required competencies and expected salary."""
    return get_candidate_roles(db, sector_id)


@app.post("/api/candidate/assess")
def candidate_assess(payload: CandidateAssessmentRequest, db: Session = Depends(get_db)):
    """
    Candidate Skill Assessment & Learning Pathway Generator:
    Takes current skills or resume text, maps against target role,
    calculates match %, highlights missing competencies, and builds milestone pathway.
    """
    return assess_candidate(db, payload.model_dump())


@app.get("/api/candidate/jobs")
def candidate_jobs(district: str | None = None, sector: str | None = None, db: Session = Depends(get_db)):
    """Jobs recommended for candidates."""
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


@app.get("/api/candidate/courses")
def candidate_courses(district: str | None = None, sector: str | None = None, db: Session = Depends(get_db)):
    """Courses recommended for candidates."""
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


# ── 2. Institutes Dashboard Endpoints ──────────────────────────

@app.get("/api/institute/overview")
def institute_overview(district_id: str | None = None, db: Session = Depends(get_db)):
    """Overview metrics for training institutes in a district or state."""
    return get_institute_overview(db, district_id)


@app.get("/api/institute/course-recommendations")
def institute_course_recommendations(district_id: str = "D001", db: Session = Depends(get_db)):
    """Recommended courses to launch or scale based on local district demand."""
    return get_institute_course_recommendations(db, district_id)


@app.get("/api/institute/curriculum-updates")
def institute_curriculum_updates(
    district_id: str = "D001",
    sector_name: str = "Automotive and Auto Components",
    db: Session = Depends(get_db),
):
    """Curriculum modernization advisories highlighting outdated vs modern modules."""
    return get_curriculum_updates(db, district_id, sector_name)


@app.get("/api/institute/trainers")
def institute_trainers(district_id: str | None = None, db: Session = Depends(get_db)):
    """Trainer records, qualifications, and required upskilling certifications."""
    return get_institute_trainers(db, district_id)


@app.get("/api/institute/lab-gaps")
def institute_lab_gaps(district_id: str | None = None, db: Session = Depends(get_db)):
    """Lab and equipment gaps, required units, and estimated budget needed."""
    return get_institute_lab_gaps(db, district_id)


@app.get("/api/institute/batch-performance")
def institute_batch_performance(district_id: str | None = None, db: Session = Depends(get_db)):
    """Batch pass rates, certification rates, and placement outcomes."""
    return get_batch_performance(db, district_id)


# ── 3. Government Dashboard Endpoints ──────────────────────────

@app.get("/api/government/kpis")
def government_kpis(db: Session = Depends(get_db)):
    """State-wide macro skill indicators, alignment index, and district performance."""
    return get_government_kpis(db)


@app.get("/api/government/gap-matrix")
def government_gap_matrix(db: Session = Depends(get_db)):
    """State-level demand vs supply gap matrix across prototype and key districts."""
    return full_mismatch_analysis(db)


@app.get("/api/government/policy-brief")
def government_policy_brief(district_id: str = "D001", db: Session = Depends(get_db)):
    """AI-powered policy recommendations and funding allocation priority brief."""
    district_data = analyze_district(db, district_id)
    return generate_policy_insights(
        district_name=district_data.get("district_name", district_id),
        sector_analysis=district_data.get("sectors", []),
        total_industry=district_data.get("district_totals", {}).get("industry_size", 0),
        total_training=district_data.get("district_totals", {}).get("mssds_training", 0),
    )


@app.post("/api/government/simulate")
def government_simulate(payload: PolicySimulationRequest, db: Session = Depends(get_db)):
    """What-if policy simulator: predict impact of moving training seats and budget."""
    return simulate_policy(
        db,
        district_id=payload.district_id,
        seat_reallocations=payload.seat_reallocations,
        additional_funding_lakhs=payload.additional_funding_lakhs,
    )


# ── 4. Continuous Feedback & Employer Outcomes ────────────────

@app.get("/api/outcomes/summary")
def outcomes_summary(db: Session = Depends(get_db)):
    """Continuous feedback metrics: interviews, hires, satisfaction, reported skill gaps."""
    return get_outcomes_intelligence(db)


@app.post("/api/outcomes/feedback")
def submit_outcome_feedback(payload: EmployerFeedbackRequest, db: Session = Depends(get_db)):
    """Employer submits hire and interview feedback, closing the continuous improvement loop."""
    outcome = EmployerOutcome(
        employer_name=payload.employer_name,
        sector_name=payload.sector_name,
        district_name=payload.district_name,
        job_role=payload.job_role,
        interviews_held=payload.interviews_held,
        candidates_hired=payload.candidates_hired,
        satisfaction_score=payload.satisfaction_score,
        avg_salary_inr=payload.avg_salary_inr,
        skills_hired=payload.skills_hired,
        reported_skill_gaps=payload.reported_skill_gaps,
        employer_feedback=payload.employer_feedback,
    )
    db.add(outcome)
    db.commit()
    return {"status": "success", "id": outcome.id, "message": "Feedback ingested into continuous loop."}


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


@app.post("/api/review/{recommendation_id}")
def review(recommendation_id: int, payload: ReviewRequest, db: Session = Depends(get_db)):
    rec = db.get(Recommendation, recommendation_id)
    if rec is None:
        raise HTTPException(404, "Recommendation record not found.")
    rec.status = payload.status
    db.commit()
    return {"id": rec.id, "status": rec.status}
