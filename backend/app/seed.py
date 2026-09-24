
"""
Data seeding pipeline for MahaSkill Intelligence.

Loads real MSSDS datasets from root-level CSV files:
  - Source_Register.csv   → source_documents table
  - District_Master.csv   → districts table
  - Sector_Taxonomy.csv   → sectors table
  - District_Indicators.csv → district_indicators table

Also loads legacy synthetic demo data for backward compatibility.
"""

import csv
from pathlib import Path
from sqlalchemy import select
from .models import (
    District, Sector, DistrictIndicator, SourceDocument,
    JobPosting, Course, Skill, CourseSkill,
)
from .services.intelligence import extract_and_store_skills

ROOT_DIR = Path(__file__).resolve().parent.parent.parent      # project root
LEGACY_DATA_DIR = Path(__file__).resolve().parent.parent / "data"  # backend/data/


def _read_csv(filepath):
    """Read a CSV file and return list of dicts."""
    with open(filepath, newline="", encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))


def seed_real_data(db):
    """Load real MSSDS datasets from root CSV files."""
    if db.scalar(select(District.id).limit(1)) is not None:
        return  # already seeded

    # 1. Source Register
    csv_path = ROOT_DIR / "Source_Register.csv"
    if csv_path.exists():
        for row in _read_csv(csv_path):
            db.add(SourceDocument(
                source_document_id=row.get("source_document_id", ""),
                source_title=row.get("source_title", ""),
                publisher=row.get("publisher", ""),
                publication_year=row.get("publication_year", ""),
                document_type=row.get("document_type", ""),
                geographic_coverage=row.get("geographic_coverage", ""),
            ))
        db.commit()

    # 2. District Master
    csv_path = ROOT_DIR / "District_Master.csv"
    if csv_path.exists():
        for row in _read_csv(csv_path):
            db.add(District(
                district_id=row.get("district_id", ""),
                district_name=row.get("district_name", ""),
                division=row.get("division", ""),
                state=row.get("state", "Maharashtra"),
                is_prototype=row.get("is_prototype_district", "No"),
                source_page=row.get("source_page", ""),
                notes=row.get("notes", ""),
            ))
        db.commit()

    # 3. Sector Taxonomy
    csv_path = ROOT_DIR / "Sector_Taxonomy.csv"
    if csv_path.exists():
        for row in _read_csv(csv_path):
            db.add(Sector(
                sector_id=row.get("sector_id", ""),
                sector_name=row.get("sector_name_canonical", ""),
                sector_aliases=row.get("sector_aliases", ""),
                sector_group=row.get("sector_group", ""),
                review_status=row.get("review_status", "Active"),
            ))
        db.commit()

    # 4. District Indicators
    csv_path = ROOT_DIR / "District_Indicators.csv"
    if csv_path.exists():
        for row in _read_csv(csv_path):
            try:
                value = int(row.get("indicator_value", "0"))
            except ValueError:
                value = 0
            db.add(DistrictIndicator(
                indicator_id=row.get("indicator_id", ""),
                district_id=row.get("district_id", ""),
                district_name=row.get("district_name", ""),
                sector_id=row.get("sector_id", ""),
                sector_name=row.get("sector_name", ""),
                indicator_name=row.get("indicator_name", ""),
                indicator_value=value,
                unit=row.get("unit", ""),
                reference_period=row.get("reference_period", ""),
                data_type=row.get("data_type", ""),
            ))
        db.commit()

    print(f"[SEED] Loaded real MSSDS data: "
          f"{db.scalar(select(District.id).limit(1)) and 'OK' or 'WARN'}")


def seed_legacy_data(db):
    """Load synthetic demo data (backward compatibility)."""
    if db.scalar(select(JobPosting.id).limit(1)) is not None:
        extract_and_store_skills(db)
        return

    jp_path = LEGACY_DATA_DIR / "job_postings.csv"
    if jp_path.exists():
        for row in _read_csv(jp_path):
            db.add(JobPosting(**row))
        db.commit()

    courses_path = LEGACY_DATA_DIR / "courses.csv"
    if courses_path.exists():
        for row in _read_csv(courses_path):
            row["seats"] = int(row.get("seats", 0))
            row["trainers"] = int(row.get("trainers", 0))
            db.add(Course(**row))
        db.commit()

    cs_path = LEGACY_DATA_DIR / "course_skills.csv"
    if cs_path.exists():
        mappings = _read_csv(cs_path)
        skill_names = {row["skill_name"] for row in mappings}
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


def seed_all(db):
    """Seed both real MSSDS data and legacy demo data."""
    seed_real_data(db)
    seed_legacy_data(db)
