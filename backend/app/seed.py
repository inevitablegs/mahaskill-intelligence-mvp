
import csv
from pathlib import Path
from sqlalchemy import select
from .models import JobPosting, Course, Skill, CourseSkill
from .services.intelligence import extract_and_store_skills

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

def seed_if_empty(db):
    if db.scalar(select(JobPosting.id).limit(1)) is not None:
        extract_and_store_skills(db)
        return
    with open(DATA_DIR / "job_postings.csv", newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            db.add(JobPosting(**row))
    db.commit()
    with open(DATA_DIR / "courses.csv", newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            row["seats"] = int(row["seats"])
            row["trainers"] = int(row["trainers"])
            db.add(Course(**row))
    db.commit()
    skill_names = set()
    with open(DATA_DIR / "course_skills.csv", newline="", encoding="utf-8") as f:
        mappings = list(csv.DictReader(f))
    for row in mappings:
        skill_names.add(row["skill_name"])
    existing = {s.name: s for s in db.scalars(select(Skill)).all()}
    for name in skill_names:
        if name not in existing:
            skill = Skill(name=name, category="Technical")
            db.add(skill)
            db.flush()
            existing[name] = skill
    db.commit()
    course_by_name = {c.name: c for c in db.scalars(select(Course)).all()}
    for row in mappings:
        course = course_by_name.get(row["course_name"])
        skill = existing.get(row["skill_name"])
        if course and skill:
            db.add(CourseSkill(course_id=course.id, skill_id=skill.id, coverage=row["coverage"]))
    db.commit()
    extract_and_store_skills(db)
