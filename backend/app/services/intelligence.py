
from collections import defaultdict
from sqlalchemy import select
from sqlalchemy.orm import Session
from ..models import JobPosting, Skill, JobSkill, Course, CourseSkill, Recommendation

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

def analyze(db: Session, district: str | None = None, sector: str | None = None):
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
    counts = defaultdict(set)
    for js in jobskills:
        counts[js.skill_id].add(js.job_id)

    mappings = db.scalars(select(CourseSkill).where(CourseSkill.course_id.in_(course_ids))).all() if course_ids else []
    coverage = defaultdict(list)
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
        if not levels:
            level = "none"
        elif all(x == "full" for x in levels):
            level = "full"
        else:
            level = "partial"
        item = {
            "skill": skill.name, "category": skill.category, "posting_count": count,
            "posting_share_pct": share, "coverage": level,
            "course_count": len(levels), "demo_only": True
        }
        demand.append(item)
        if share >= 25 and level != "full":
            gap = {**item, "gap_type": "potential_course_gap" if level == "none" else "potential_module_gap"}
            gaps.append(gap)

    demand.sort(key=lambda x: (-x["posting_count"], x["skill"]))
    gaps.sort(key=lambda x: (-x["posting_share_pct"], x["skill"]))
    recs = []
    for gap in gaps:
        if gap["coverage"] == "none":
            action = f"Review adding {gap['skill']} to a relevant course"
        else:
            action = f"Review expanding practical coverage for {gap['skill']}"
        recs.append({
            "id": None, "district": district or "All", "sector": sector or "All",
            "skill": gap["skill"], "action": action,
            "rationale": f"Detected in {gap['posting_count']} of {len(jobs)} synthetic demo postings ({gap['posting_share_pct']}%). Current mapped course coverage: {gap['coverage']}. Validate with employers and training providers.",
            "status": "suggested", "demo_only": True
        })
    return {"jobs": jobs, "courses": courses, "demand": demand, "gaps": gaps, "recommendations": recs}
