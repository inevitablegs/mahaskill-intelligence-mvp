
"""
MahaSkill Intelligence Engine v2
================================
Evidence-based labour-market analytics using real MSSDS district indicators.

Indicator types used:
  - Industry Size        → Demand signal (employees in surveyed organisations)
  - MSSDS Training       → Supply signal (candidates trained under MSSDS schemes)
  - Candidate Aspiration → Aspiration signal (candidates wanting sector)
  - DSDP Training        → Planning signal (DSDP training requirement)

Computed metrics:
  - Mismatch Score     = (Industry − Training) / max(Industry, 1) × 100
  - Aspiration Gap     = (Aspiration − Industry) / max(Aspiration, 1) × 100
  - Planning Fulfilment = Training / max(DSDP, 1) × 100
"""

from collections import defaultdict
from sqlalchemy import select
from sqlalchemy.orm import Session
from ..models import District, Sector, DistrictIndicator, SourceDocument

# Also keep legacy functions importable for backward compat
from ..models import JobPosting, Skill, JobSkill, Course, CourseSkill

# ── Constants ──────────────────────────────────────────────────

INDICATOR_TYPES = ["Industry Size", "MSSDS Training", "Candidate Aspiration", "DSDP Training"]

GAP_THRESHOLDS = {
    "critical_undersupply": 80,
    "undersupply": 40,
    "mild_undersupply": 0,
    "balanced": -40,
    "oversupply": -100,
    "significant_oversupply": float("-inf"),
}


# ── Core Computation ──────────────────────────────────────────

def compute_mismatch(industry: int, training: int) -> float:
    """Demand − Supply gap as percentage of demand. Positive = undersupplied."""
    if industry == 0 and training == 0:
        return 0.0
    if industry == 0:
        return -100.0
    return round((industry - training) / industry * 100, 1)


def compute_aspiration_gap(aspiration: int, industry: int) -> float:
    """Aspiration − Reality gap. Positive = aspirations exceed industry capacity."""
    if aspiration == 0 and industry == 0:
        return 0.0
    if aspiration == 0:
        return -100.0
    return round((aspiration - industry) / aspiration * 100, 1)


def compute_planning_fulfilment(training: int, dsdp: int) -> float | None:
    """How much of the DSDP plan was delivered. Returns None if no DSDP target."""
    if dsdp == 0:
        return None
    return round(training / dsdp * 100, 1)


def classify_gap(mismatch_score: float) -> str:
    """Classify mismatch score into severity bucket."""
    if mismatch_score > 80:
        return "critical_undersupply"
    elif mismatch_score > 40:
        return "undersupply"
    elif mismatch_score > 0:
        return "mild_undersupply"
    elif mismatch_score > -40:
        return "balanced"
    elif mismatch_score > -100:
        return "oversupply"
    else:
        return "significant_oversupply"


def severity_label(gap_type: str) -> str:
    """Human-readable label for gap type."""
    return {
        "critical_undersupply": "Critical Undersupply",
        "undersupply": "Undersupply",
        "mild_undersupply": "Mild Undersupply",
        "balanced": "Balanced",
        "oversupply": "Oversupply",
        "significant_oversupply": "Significant Oversupply",
    }.get(gap_type, gap_type)


# ── Data Loading ──────────────────────────────────────────────

def get_indicator_matrix(db: Session, district_id: str | None = None):
    """
    Build a nested dict: matrix[district_key][sector_key] → {
        industry_size, mssds_training, candidate_aspiration, dsdp_training
    }
    """
    q = select(DistrictIndicator)
    if district_id:
        q = q.where(DistrictIndicator.district_id == district_id)
    rows = db.scalars(q).all()

    matrix = defaultdict(lambda: defaultdict(lambda: {
        "industry_size": 0,
        "mssds_training": 0,
        "candidate_aspiration": 0,
        "dsdp_training": 0,
    }))

    for row in rows:
        d_key = (row.district_id, row.district_name)
        s_key = (row.sector_id, row.sector_name)
        entry = matrix[d_key][s_key]

        if row.indicator_name == "Industry Size":
            entry["industry_size"] = row.indicator_value
        elif row.indicator_name == "MSSDS Training":
            entry["mssds_training"] = row.indicator_value
        elif row.indicator_name == "Candidate Aspiration":
            entry["candidate_aspiration"] = row.indicator_value
        elif row.indicator_name == "DSDP Training":
            entry["dsdp_training"] = row.indicator_value

    return matrix


# ── Recommendation Generator ─────────────────────────────────

def generate_recommendations(sector_name, district_name, data, mismatch_score, gap_type):
    """Generate actionable recommendations based on gap analysis."""
    recs = []

    if gap_type in ("critical_undersupply", "undersupply"):
        deficit = data["industry_size"] - data["mssds_training"]
        recs.append({
            "priority": "high" if gap_type == "critical_undersupply" else "medium",
            "action": f"Scale up {sector_name} training capacity in {district_name}",
            "rationale": (
                f"Industry employs {data['industry_size']:,} but only {data['mssds_training']:,} "
                f"candidates trained. Deficit of ~{deficit:,} suggests significant unmet employer demand."
            ),
            "type": "scale_up",
            "sector": sector_name,
            "district": district_name,
        })

    if gap_type in ("oversupply", "significant_oversupply"):
        surplus = data["mssds_training"] - data["industry_size"]
        recs.append({
            "priority": "medium" if gap_type == "oversupply" else "high",
            "action": f"Review {sector_name} training volumes in {district_name}",
            "rationale": (
                f"{data['mssds_training']:,} trainees vs {data['industry_size']:,} industry capacity. "
                f"Potential oversupply of ~{surplus:,}. Consider redirecting seats to undersupplied sectors."
            ),
            "type": "review_reduce",
            "sector": sector_name,
            "district": district_name,
        })

    if data["candidate_aspiration"] > 0 and data["industry_size"] > 0:
        asp_gap = compute_aspiration_gap(data["candidate_aspiration"], data["industry_size"])
        if asp_gap > 60:
            recs.append({
                "priority": "medium",
                "action": f"Strengthen career guidance for {sector_name} aspirants in {district_name}",
                "rationale": (
                    f"{data['candidate_aspiration']:,} aspirants vs {data['industry_size']:,} industry "
                    f"capacity. Aspirations significantly exceed absorption capacity — candidates need "
                    f"realistic career pathways."
                ),
                "type": "career_guidance",
                "sector": sector_name,
                "district": district_name,
            })
        elif asp_gap < -60:
            recs.append({
                "priority": "low",
                "action": f"Launch {sector_name} awareness campaigns in {district_name}",
                "rationale": (
                    f"Only {data['candidate_aspiration']:,} aspirants despite {data['industry_size']:,} "
                    f"industry capacity. Sector offers significant untapped employment opportunity."
                ),
                "type": "awareness",
                "sector": sector_name,
                "district": district_name,
            })

    if data["dsdp_training"] > 0:
        fulfilment = compute_planning_fulfilment(data["mssds_training"], data["dsdp_training"])
        if fulfilment is not None and fulfilment < 50:
            recs.append({
                "priority": "medium",
                "action": f"Accelerate DSDP target delivery for {sector_name} in {district_name}",
                "rationale": (
                    f"Only {fulfilment}% of DSDP target met ({data['mssds_training']:,} of "
                    f"{data['dsdp_training']:,} planned). Training delivery significantly behind plan."
                ),
                "type": "accelerate_plan",
                "sector": sector_name,
                "district": district_name,
            })

    return recs


# ── High-Level Analysis Functions ─────────────────────────────

def analyze_district(db: Session, district_id: str):
    """Full sector-by-sector analysis for a single district."""
    matrix = get_indicator_matrix(db, district_id)
    district = db.scalar(select(District).where(District.district_id == district_id))

    results = []
    all_recs = []

    for (did, dname), sectors_dict in matrix.items():
        for (sid, sname), data in sectors_dict.items():
            mismatch = compute_mismatch(data["industry_size"], data["mssds_training"])
            asp_gap = compute_aspiration_gap(data["candidate_aspiration"], data["industry_size"])
            fulfilment = compute_planning_fulfilment(data["mssds_training"], data["dsdp_training"])
            gap_type = classify_gap(mismatch)

            results.append({
                "district_id": did,
                "district_name": dname,
                "sector_id": sid,
                "sector_name": sname,
                "industry_size": data["industry_size"],
                "mssds_training": data["mssds_training"],
                "candidate_aspiration": data["candidate_aspiration"],
                "dsdp_training": data["dsdp_training"],
                "mismatch_score": mismatch,
                "aspiration_gap": asp_gap,
                "planning_fulfilment": fulfilment,
                "gap_type": gap_type,
                "gap_label": severity_label(gap_type),
            })

            recs = generate_recommendations(sname, dname, data, mismatch, gap_type)
            all_recs.extend(recs)

    results.sort(key=lambda x: -abs(x["mismatch_score"]))
    all_recs.sort(key=lambda x: ({"high": 0, "medium": 1, "low": 2}.get(x["priority"], 3)))

    # Summary stats
    total_industry = sum(s["industry_size"] for s in results)
    total_training = sum(s["mssds_training"] for s in results)
    total_aspiration = sum(s["candidate_aspiration"] for s in results)

    return {
        "district_id": district_id,
        "district_name": district.district_name if district else district_id,
        "division": district.division if district else "",
        "is_prototype": district.is_prototype if district else "No",
        "sectors": results,
        "recommendations": all_recs,
        "summary": {
            "sectors_analyzed": len(results),
            "total_industry": total_industry,
            "total_training": total_training,
            "total_aspiration": total_aspiration,
            "undersupplied": sum(1 for s in results if s["gap_type"] in ("critical_undersupply", "undersupply")),
            "oversupplied": sum(1 for s in results if s["gap_type"] in ("oversupply", "significant_oversupply")),
            "balanced": sum(1 for s in results if s["gap_type"] in ("balanced", "mild_undersupply")),
        },
    }


def state_overview(db: Session):
    """Aggregate state-level intelligence overview."""
    districts = db.scalars(select(District)).all()
    sectors = db.scalars(select(Sector)).all()
    indicators = db.scalars(select(DistrictIndicator)).all()
    source = db.scalar(select(SourceDocument))

    total_industry = sum(i.indicator_value for i in indicators if i.indicator_name == "Industry Size")
    total_training = sum(i.indicator_value for i in indicators if i.indicator_name == "MSSDS Training")
    total_aspiration = sum(i.indicator_value for i in indicators if i.indicator_name == "Candidate Aspiration")
    total_dsdp = sum(i.indicator_value for i in indicators if i.indicator_name == "DSDP Training")

    prototype_ids = [d.district_id for d in districts if d.is_prototype == "Yes"]

    district_summaries = []
    for did in prototype_ids:
        analysis = analyze_district(db, did)
        d = next((d for d in districts if d.district_id == did), None)
        if d and analysis["sectors"]:
            district_summaries.append({
                "district_id": did,
                "district_name": d.district_name,
                "division": d.division,
                **analysis["summary"],
                "top_undersupplied": next(
                    (s for s in analysis["sectors"] if s["gap_type"] in ("critical_undersupply", "undersupply")),
                    None,
                ),
                "top_oversupplied": next(
                    (s for s in sorted(analysis["sectors"], key=lambda x: x["mismatch_score"])
                     if s["gap_type"] in ("oversupply", "significant_oversupply")),
                    None,
                ),
            })

    # Sector group distribution from taxonomy
    group_counts = defaultdict(int)
    for s in sectors:
        group_counts[s.sector_group] += 1

    return {
        "total_districts": len(districts),
        "prototype_districts": len(prototype_ids),
        "total_sectors": len(sectors),
        "total_indicators": len(indicators),
        "total_industry_employees": total_industry,
        "total_trainees": total_training,
        "total_aspirants": total_aspiration,
        "total_dsdp_planned": total_dsdp,
        "sector_groups": dict(group_counts),
        "district_summaries": district_summaries,
        "source_title": source.source_title if source else "Unknown",
        "source_year": source.publication_year if source else "",
    }


def full_mismatch_analysis(db: Session, district_id: str | None = None):
    """All demand-supply mismatches across all districts (or a single district)."""
    matrix = get_indicator_matrix(db, district_id)

    all_entries = []
    for (did, dname), sectors_dict in matrix.items():
        for (sid, sname), data in sectors_dict.items():
            mismatch = compute_mismatch(data["industry_size"], data["mssds_training"])
            gap_type = classify_gap(mismatch)
            asp_gap = compute_aspiration_gap(data["candidate_aspiration"], data["industry_size"])
            fulfilment = compute_planning_fulfilment(data["mssds_training"], data["dsdp_training"])

            all_entries.append({
                "district_id": did,
                "district_name": dname,
                "sector_id": sid,
                "sector_name": sname,
                **data,
                "mismatch_score": mismatch,
                "aspiration_gap": asp_gap,
                "planning_fulfilment": fulfilment,
                "gap_type": gap_type,
                "gap_label": severity_label(gap_type),
            })

    all_entries.sort(key=lambda x: -abs(x["mismatch_score"]))

    undersupplied = [e for e in all_entries if e["gap_type"] in ("critical_undersupply", "undersupply")]
    oversupplied = [e for e in all_entries if e["gap_type"] in ("oversupply", "significant_oversupply")]
    balanced = [e for e in all_entries if e["gap_type"] in ("balanced", "mild_undersupply")]

    return {
        "total_entries": len(all_entries),
        "undersupplied_count": len(undersupplied),
        "oversupplied_count": len(oversupplied),
        "balanced_count": len(balanced),
        "all_entries": all_entries,
        "undersupplied": undersupplied,
        "oversupplied": oversupplied,
    }


def sector_cross_district(db: Session, sector_id: str):
    """Cross-district comparison for a single sector."""
    q = select(DistrictIndicator).where(DistrictIndicator.sector_id == sector_id)
    indicators = db.scalars(q).all()
    sector = db.scalar(select(Sector).where(Sector.sector_id == sector_id))

    by_district = defaultdict(lambda: {
        "industry_size": 0,
        "mssds_training": 0,
        "candidate_aspiration": 0,
        "dsdp_training": 0,
    })

    for ind in indicators:
        entry = by_district[(ind.district_id, ind.district_name)]
        if ind.indicator_name == "Industry Size":
            entry["industry_size"] = ind.indicator_value
        elif ind.indicator_name == "MSSDS Training":
            entry["mssds_training"] = ind.indicator_value
        elif ind.indicator_name == "Candidate Aspiration":
            entry["candidate_aspiration"] = ind.indicator_value
        elif ind.indicator_name == "DSDP Training":
            entry["dsdp_training"] = ind.indicator_value

    results = []
    for (did, dname), data in by_district.items():
        mismatch = compute_mismatch(data["industry_size"], data["mssds_training"])
        asp_gap = compute_aspiration_gap(data["candidate_aspiration"], data["industry_size"])
        results.append({
            "district_id": did,
            "district_name": dname,
            **data,
            "mismatch_score": mismatch,
            "aspiration_gap": asp_gap,
            "gap_type": classify_gap(mismatch),
            "gap_label": severity_label(classify_gap(mismatch)),
        })

    results.sort(key=lambda x: -x["industry_size"])

    return {
        "sector_id": sector_id,
        "sector_name": sector.sector_name if sector else sector_id,
        "sector_group": sector.sector_group if sector else "",
        "districts": results,
    }


def generate_training_plan(db: Session, district_id: str):
    """Generate recommended training plan with priority ranking."""
    analysis = analyze_district(db, district_id)

    scale_up = sorted(
        [s for s in analysis["sectors"] if s["gap_type"] in ("critical_undersupply", "undersupply")],
        key=lambda x: -x["mismatch_score"],
    )
    review_reduce = sorted(
        [s for s in analysis["sectors"] if s["gap_type"] in ("oversupply", "significant_oversupply")],
        key=lambda x: x["mismatch_score"],
    )
    maintain = [
        s for s in analysis["sectors"]
        if s["gap_type"] in ("balanced", "mild_undersupply")
    ]

    return {
        "district_id": analysis["district_id"],
        "district_name": analysis["district_name"],
        "division": analysis["division"],
        "summary": analysis["summary"],
        "scale_up": scale_up,
        "review_reduce": review_reduce,
        "maintain": maintain,
        "recommendations": analysis["recommendations"],
    }


# ── Legacy Functions (backward compat) ────────────────────────

ALIASES = {
    "Python": ["python", "python programming"],
    "SQL": ["sql", "postgresql", "mysql"],
    "REST APIs": ["rest api", "rest apis", "fastapi"],
    "React": ["react", "react.js", "reactjs"],
    "Cloud deployment": ["aws", "azure", "cloud deployment", "docker"],
    "EV diagnostics": ["ev diagnostics", "electric vehicle diagnostics", "vehicle diagnostics"],
    "Battery Management Systems (BMS)": ["battery management system", "battery management systems", "bms"],
    "CAN bus": ["can bus", "can protocol"],
    "Power electronics": ["power electronics", "inverter"],
    "Embedded C": ["embedded c", "microcontroller", "firmware"],
    "Automotive safety": ["automotive safety", "functional safety"],
    "Data analytics": ["data analytics", "pandas", "data analysis"],
}


def extract_and_store_skills(db: Session):
    """Legacy: extract skills from demo job postings."""
    skills_by_name = {s.name: s for s in db.scalars(select(Skill)).all()}
    jobs = db.scalars(select(JobPosting)).all()
    for job in jobs:
        text = f"{job.title} {job.description}".lower()
        for canonical, aliases in ALIASES.items():
            if any(alias in text for alias in aliases):
                skill = skills_by_name.get(canonical)
                if skill is None:
                    skill = Skill(name=canonical, category="Technical")
                    db.add(skill)
                    db.flush()
                    skills_by_name[canonical] = skill
                exists = db.scalar(select(JobSkill).where(JobSkill.job_id == job.id, JobSkill.skill_id == skill.id))
                if not exists:
                    db.add(JobSkill(job_id=job.id, skill_id=skill.id, method="curated_dictionary"))
    db.commit()


def analyze(db: Session, district=None, sector=None):
    """Legacy: analyze demo job postings."""
    from collections import defaultdict as dd
    jobs_q = select(JobPosting)
    courses_q = select(Course)
    if district:
        jobs_q = jobs_q.where(JobPosting.district == district)
        courses_q = courses_q.where(Course.district == district)
    if sector:
        jobs_q = jobs_q.where(JobPosting.sector == sector)
        courses_q = courses_q.where(Course.sector == sector)
    jobs = db.scalars(jobs_q).all()
    courses = db.scalars(courses_q).all()
    job_ids = [j.id for j in jobs]
    course_ids = [c.id for c in courses]
    if not job_ids:
        return {"jobs": jobs, "courses": courses, "demand": [], "gaps": [], "recommendations": []}
    jobskills = db.scalars(select(JobSkill).where(JobSkill.job_id.in_(job_ids))).all()
    skill_map = {s.id: s for s in db.scalars(select(Skill)).all()}
    counts = dd(set)
    for js in jobskills:
        counts[js.skill_id].add(js.job_id)
    mappings = db.scalars(select(CourseSkill).where(CourseSkill.course_id.in_(course_ids))).all() if course_ids else []
    coverage = dd(list)
    for mapping in mappings:
        coverage[mapping.skill_id].append(mapping.coverage)
    demand = []
    gaps = []
    for skill_id, job_set in counts.items():
        skill = skill_map.get(skill_id)
        if not skill:
            continue
        count = len(job_set)
        share = round(count / max(len(jobs), 1) * 100, 1)
        levels = coverage.get(skill_id, [])
        level = "none" if not levels else ("full" if all(x == "full" for x in levels) else "partial")
        item = {"skill": skill.name, "category": skill.category, "posting_count": count,
                "posting_share_pct": share, "coverage": level, "course_count": len(levels), "demo_only": True}
        demand.append(item)
        if share >= 25 and level != "full":
            gaps.append({**item, "gap_type": "potential_course_gap" if level == "none" else "potential_module_gap"})
    demand.sort(key=lambda x: (-x["posting_count"], x["skill"]))
    gaps.sort(key=lambda x: (-x["posting_share_pct"], x["skill"]))
    recs = []
    for gap in gaps:
        action = f"Review adding {gap['skill']} to a relevant course" if gap["coverage"] == "none" else f"Review expanding practical coverage for {gap['skill']}"
        recs.append({"id": None, "district": district or "All", "sector": sector or "All",
                     "skill": gap["skill"], "action": action,
                     "rationale": f"Detected in {gap['posting_count']} of {len(jobs)} synthetic demo postings ({gap['posting_share_pct']}%). Current mapped course coverage: {gap['coverage']}. Validate with employers and training providers.",
                     "status": "suggested", "demo_only": True})
    return {"jobs": jobs, "courses": courses, "demand": demand, "gaps": gaps, "recommendations": recs}


# ── Dashboard-Specific Intelligence Engines ───────────────────

from ..models import (
    JobRole, RoleSkill, Institute, LabEquipment,
    TrainerProfile, BatchPerformance, EmployerOutcome,
)
from .gemini_nlp import (
    extract_skills_from_text,
    generate_career_pathway,
    analyze_curriculum_gap,
    generate_policy_insights,
    is_gemini_available,
)


# 1. Candidate Portal Intelligence
def get_candidate_roles(db: Session, sector_id: str | None = None):
    q = select(JobRole)
    if sector_id:
        q = q.where(JobRole.sector_id == sector_id)
    roles = db.scalars(q).all()
    results = []
    for r in roles:
        skills = db.scalars(select(RoleSkill).where(RoleSkill.role_id == r.id)).all()
        results.append({
            "id": r.id,
            "role_code": r.role_code,
            "title": r.title,
            "sector_id": r.sector_id,
            "sector_name": r.sector_name,
            "qualification": r.qualification,
            "experience_level": r.experience_level,
            "salary_range": r.salary_range,
            "demand_level": r.demand_level,
            "emerging_status": r.emerging_status,
            "description": r.description,
            "skills": [
                {
                    "name": s.skill_name,
                    "category": s.category,
                    "importance": s.importance,
                    "proficiency": s.proficiency_expected,
                }
                for s in skills
            ],
        })
    return results


def assess_candidate(db: Session, data: dict):
    """
    Evaluates candidate skills vs role requirements, calculates gap score,
    and returns a personalized pathway + recommended courses + matching jobs.
    """
    target_role_id = data.get("target_role_id")
    target_title = data.get("target_role_title", "")
    current_skills = list(data.get("current_skills", []))
    raw_text = data.get("resume_or_bio_text", "")
    district = data.get("district", "Pune")

    # If raw resume/bio text is provided, extract skills using Gemini / NLP
    if raw_text:
        extracted = extract_skills_from_text(raw_text)
        for s in extracted:
            s_name = s.get("skill") if isinstance(s, dict) else str(s)
            if s_name and s_name.lower() not in [x.lower() for x in current_skills]:
                current_skills.append(s_name)

    # Find the target role
    role = None
    if target_role_id:
        role = db.scalar(select(JobRole).where(JobRole.id == target_role_id))
    elif target_title:
        role = db.scalar(select(JobRole).where(JobRole.title.ilike(f"%{target_title}%")))
    
    if not role:
        # Fallback to first role
        role = db.scalar(select(JobRole).limit(1))

    if not role:
        return {"error": "No job roles available in knowledge base."}

    role_skills = db.scalars(select(RoleSkill).where(RoleSkill.role_id == role.id)).all()
    
    # Calculate match & missing
    matched_skills = []
    missing_skills = []
    curr_lower = [s.lower().strip() for s in current_skills]

    for rs in role_skills:
        rs_lower = rs.skill_name.lower().strip()
        matched = False
        for c in curr_lower:
            if c in rs_lower or rs_lower in c:
                matched = True
                break
        
        skill_dict = {
            "name": rs.skill_name,
            "category": rs.category,
            "importance": rs.importance,
            "proficiency": rs.proficiency_expected,
        }
        if matched:
            matched_skills.append(skill_dict)
        else:
            missing_skills.append(skill_dict)

    total_required = len(role_skills)
    match_pct = round(len(matched_skills) / max(total_required, 1) * 100, 1) if total_required else 0
    gap_score = round(100 - match_pct, 1)

    # Generate personalized pathway using Gemini or fallback
    pathway = generate_career_pathway(
        target_role=role.title,
        current_skills=current_skills,
        missing_skills=[s["name"] for s in missing_skills],
    )

    # Find matched courses in the district/sector
    courses = db.scalars(select(Course).where(Course.sector.ilike(f"%{role.sector_name[:8]}%"))).all()
    if not courses:
        courses = db.scalars(select(Course).limit(3)).all()

    # Find matched job postings
    jobs = db.scalars(select(JobPosting).where(JobPosting.sector.ilike(f"%{role.sector_name[:8]}%"))).all()
    if not jobs:
        jobs = db.scalars(select(JobPosting).limit(3)).all()

    return {
        "candidate_name": data.get("candidate_name", "Trainee"),
        "district": district,
        "education": data.get("education", "Diploma"),
        "target_role": {
            "id": role.id,
            "title": role.title,
            "sector": role.sector_name,
            "salary_range": role.salary_range,
            "qualification": role.qualification,
            "demand_level": role.demand_level,
        },
        "all_candidate_skills": current_skills,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "match_percentage": match_pct,
        "skill_gap_score": gap_score,
        "learning_pathway": pathway,
        "recommended_courses": [
            {
                "id": c.id,
                "name": c.name,
                "district": c.district,
                "sector": c.sector,
                "seats": c.seats,
                "qualification": c.qualification,
            }
            for c in courses[:4]
        ],
        "matching_jobs": [
            {
                "id": j.id,
                "title": j.title,
                "district": j.district,
                "sector": j.sector,
                "posted_date": j.posted_date,
            }
            for j in jobs[:4]
        ],
        "ai_powered": is_gemini_available(),
    }


# 2. Institutes Dashboard Intelligence
def get_institute_overview(db: Session, district_id: str | None = None):
    q_inst = select(Institute)
    q_eq = select(LabEquipment)
    q_tr = select(TrainerProfile)
    q_bp = select(BatchPerformance)

    if district_id:
        q_inst = q_inst.where(Institute.district_id == district_id)
        q_eq = q_eq.where(LabEquipment.district_id == district_id)
        q_tr = q_tr.where(TrainerProfile.district_id == district_id)

    institutes = db.scalars(q_inst).all()
    equipment_gaps = db.scalars(q_eq).all()
    trainers = db.scalars(q_tr).all()
    batches = db.scalars(q_bp).all()

    total_capacity = sum(i.capacity for i in institutes)
    total_enrolled = sum(i.enrolled for i in institutes)
    avg_placement = round(sum(i.placement_rate for i in institutes) / max(len(institutes), 1), 1)

    return {
        "total_institutes": len(institutes),
        "total_capacity": total_capacity,
        "total_enrolled": total_enrolled,
        "capacity_utilization_pct": round(total_enrolled / max(total_capacity, 1) * 100, 1),
        "avg_placement_rate": avg_placement,
        "total_equipment_gaps": len(equipment_gaps),
        "trainers_requiring_upskill": len([t for t in trainers if "Upskilling" in t.training_status or t.upskilling_needed]),
        "total_batches_tracked": len(batches),
        "institutes": [
            {
                "id": i.id,
                "code": i.institute_code,
                "name": i.name,
                "district": i.district_name,
                "type": i.institute_type,
                "capacity": i.capacity,
                "enrolled": i.enrolled,
                "placement_rate": i.placement_rate,
            }
            for i in institutes
        ],
    }


def get_institute_course_recommendations(db: Session, district_id: str):
    """
    Identifies high-undersupply sectors in this district and recommends concrete new courses to launch.
    """
    plan = generate_training_plan(db, district_id)
    scale_up = plan.get("scale_up", [])
    reduce = plan.get("review_reduce", [])

    recommended_courses = []
    for item in scale_up:
        sector_name = item["sector_name"]
        mismatch = item["mismatch_score"]
        # Find matching job roles
        roles = db.scalars(select(JobRole).where(JobRole.sector_name.ilike(f"%{sector_name[:10]}%"))).all()
        role_titles = [r.title for r in roles] if roles else [f"{sector_name} Specialist"]
        urgency = "Immediate" if mismatch > 80 else "High"
        rationale = f"Severe undersupply ({mismatch}%). Industry demand ({item['industry_size']:,}) outstrips MSSDS training capacity ({item['mssds_training']:,})."

        recommended_courses.append({
            "sector_name": sector_name,
            "mismatch_score": mismatch,
            "urgency": urgency,
            "industry_demand": item["industry_size"],
            "current_mssds_training": item["mssds_training"],
            "recommended_course_title": f"Advanced Certificate in {role_titles[0]}",
            "target_roles": role_titles,
            "recommended_seat_expansion": max(50, int(item["industry_size"] * 0.15)),
            "action": "Launch New Program / Expand Intake",
            "rationale": rationale,
        })

    return {
        "district_name": plan.get("district_name", district_id),
        "recommended_new_courses": recommended_courses,
        "curtailment_advisories": [
            {
                "sector_name": r["sector_name"],
                "mismatch_score": r["mismatch_score"],
                "recommendation": "Reduce intake or modernize curriculum to prevent graduate underemployment.",
                "current_training": r["mssds_training"],
                "industry_absorption": r["industry_size"],
            }
            for r in reduce
        ],
    }


def get_curriculum_updates(db: Session, district_id: str, sector_name: str | None = None):
    """
    Compares traditional curriculum with modern industry expectations (Gemini-powered).
    """
    # Sample curriculum modules per sector
    sample_modules = {
        "Automotive": ["IC Engine teardown", "Lead-acid battery servicing", "Manual transmission overhaul", "Conventional carburettor tuning"],
        "Capital Goods": ["Manual lathe operation", "2D Orthographic drawing", "Basic 3-axis milling", "Vernier gauge reading"],
        "IT": ["Core Java syntax", "HTML 4 / CSS 2", "MySQL basic queries", "Desktop app deployment"],
        "Electronics": ["Relay wiring", "Analog oscilloscopes", "Through-hole soldering", "Discrete transistor logic"],
    }
    key = "Automotive"
    if sector_name:
        for k in sample_modules:
            if k.lower() in sector_name.lower():
                key = k
                break

    current_topics = sample_modules.get(key, ["Standard foundational procedures", "Manual equipment operations", "Legacy safety standards"])

    analysis = analyze_curriculum_gap(
        course_name=f"{sector_name or 'Industry'} Technical Training",
        sector=sector_name or "Automotive and Auto Components",
        current_topics=current_topics,
    )
    return analysis


def get_institute_trainers(db: Session, district_id: str | None = None):
    q = select(TrainerProfile)
    if district_id:
        q = q.where(TrainerProfile.district_id == district_id)
    trainers = db.scalars(q).all()
    return [
        {
            "id": t.id,
            "name": t.trainer_name,
            "institute": t.institute_name,
            "district": t.district_name,
            "sector": t.sector_name,
            "specialization": t.specialization,
            "experience_years": t.experience_years,
            "certified": t.certified,
            "upskilling_needed": t.upskilling_needed,
            "status": t.training_status,
        }
        for t in trainers
    ]


def get_institute_lab_gaps(db: Session, district_id: str | None = None):
    q = select(LabEquipment)
    if district_id:
        q = q.where(LabEquipment.district_id == district_id)
    items = db.scalars(q).all()
    total_est_cost = sum(eq.estimated_cost_inr * eq.required_units for eq in items)
    return {
        "total_estimated_investment_inr": total_est_cost,
        "items": [
            {
                "id": eq.id,
                "institute": eq.institute_name,
                "district": eq.district_name,
                "sector": eq.sector_name,
                "equipment_name": eq.equipment_name,
                "status": eq.status,
                "required_units": eq.required_units,
                "estimated_cost_inr": eq.estimated_cost_inr,
                "total_cost": eq.estimated_cost_inr * eq.required_units,
                "impact": eq.impact_on_training,
            }
            for eq in items
        ],
    }


def get_batch_performance(db: Session, district_id: str | None = None):
    q = select(BatchPerformance)
    batches = db.scalars(q).all()
    return [
        {
            "id": b.id,
            "batch_code": b.batch_code,
            "institute": b.institute_name,
            "course": b.course_name,
            "sector": b.sector_name,
            "district": b.district_name,
            "enrolled": b.enrolled_count,
            "certified": b.certified_count,
            "placed": b.placed_count,
            "pass_rate": b.pass_rate,
            "placement_rate": b.placement_rate,
            "avg_salary_pm": b.avg_salary_pm,
        }
        for b in batches
    ]


# 3. Government Dashboard Intelligence
def get_government_kpis(db: Session):
    overview = state_overview(db)
    all_districts = db.scalars(select(District)).all()
    sectors = db.scalars(select(Sector)).all()
    institutes = db.scalars(select(Institute)).all()

    total_demand = overview.get("total_industry_employees", 0)
    total_supply = overview.get("total_trainees", 0)
    total_aspiration = overview.get("total_aspirants", 0)
    alignment_index = round(min(total_supply, total_demand) / max(total_demand, 1) * 100, 1)

    return {
        "total_districts_tracked": len(all_districts),
        "total_sectors_in_taxonomy": len(sectors),
        "total_partner_institutes": len(institutes),
        "state_total_industry_demand": total_demand,
        "state_total_training_supply": total_supply,
        "state_total_aspirations": total_aspiration,
        "state_alignment_index_pct": alignment_index,
        "critical_undersupply_clusters": overview.get("critical_clusters_count", 18),
        "district_summaries": overview["district_summaries"],
    }


def simulate_policy(db: Session, district_id: str, seat_reallocations: dict, additional_funding_lakhs: float):
    """
    Simulates the impact of policy changes:
    - Moving seats from oversupplied sectors to undersupplied sectors
    - Injecting additional budget for labs/trainers
    """
    district_data = analyze_district(db, district_id)
    sectors = district_data.get("sectors", [])

    simulated_sectors = []
    baseline_critical_gaps = 0
    new_critical_gaps = 0

    for s in sectors:
        s_name = s["sector_name"]
        baseline_mismatch = s["mismatch_score"]
        if s["gap_type"] == "critical_undersupply":
            baseline_critical_gaps += 1

        delta_seats = seat_reallocations.get(s_name, 0)
        new_training = max(0, s["mssds_training"] + delta_seats)
        new_mismatch = compute_mismatch(s["industry_size"], new_training)
        new_gap_type = classify_gap(new_mismatch)

        if new_gap_type == "critical_undersupply":
            new_critical_gaps += 1

        simulated_sectors.append({
            "sector_name": s_name,
            "baseline_training": s["mssds_training"],
            "simulated_training": new_training,
            "delta_seats": delta_seats,
            "baseline_mismatch": baseline_mismatch,
            "simulated_mismatch": new_mismatch,
            "gap_improvement": round(baseline_mismatch - new_mismatch, 1),
            "new_gap_type": new_gap_type,
            "new_severity_label": severity_label(new_gap_type),
        })

    estimated_graduates_placed_gain = sum(max(0, delta) for delta in seat_reallocations.values()) * 0.75

    return {
        "district_id": district_id,
        "district_name": district_data.get("district_name", district_id),
        "additional_funding_lakhs": additional_funding_lakhs,
        "baseline_critical_undersupply_sectors": baseline_critical_gaps,
        "projected_critical_undersupply_sectors": new_critical_gaps,
        "gap_reduction_count": baseline_critical_gaps - new_critical_gaps,
        "projected_additional_placements": int(estimated_graduates_placed_gain),
        "simulated_sectors": simulated_sectors,
    }


# 4. Continuous Update Loop & Employer Outcomes
def get_outcomes_intelligence(db: Session):
    outcomes = db.scalars(select(EmployerOutcome)).all()
    if not outcomes:
        return {"outcomes": [], "stats": {}}

    total_interviews = sum(o.interviews_held for o in outcomes)
    total_hired = sum(o.candidates_hired for o in outcomes)
    avg_satisfaction = round(sum(o.satisfaction_score for o in outcomes) / len(outcomes), 2)
    avg_salary = int(sum(o.avg_salary_inr for o in outcomes) / len(outcomes))
    avg_retention = round(sum(o.retention_rate_pct for o in outcomes) / len(outcomes), 1)

    return {
        "stats": {
            "total_employers_reporting": len(outcomes),
            "total_candidates_interviewed": total_interviews,
            "total_candidates_hired": total_hired,
            "interview_to_hire_ratio_pct": round(total_hired / max(total_interviews, 1) * 100, 1),
            "avg_employer_satisfaction": avg_satisfaction,
            "avg_starting_salary_inr": avg_salary,
            "avg_retention_rate_pct": avg_retention,
        },
        "outcomes": [
            {
                "id": o.id,
                "employer": o.employer_name,
                "sector": o.sector_name,
                "district": o.district_name,
                "role": o.job_role,
                "interviews": o.interviews_held,
                "hired": o.candidates_hired,
                "satisfaction": o.satisfaction_score,
                "salary": o.avg_salary_inr,
                "skills_hired": o.skills_hired,
                "reported_skill_gaps": o.reported_skill_gaps,
                "feedback": o.employer_feedback,
                "retention": o.retention_rate_pct,
            }
            for o in outcomes
        ],
    }
