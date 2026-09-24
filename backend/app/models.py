
from sqlalchemy import String, Integer, Float, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base

# ── Real MSSDS Dataset Models ──────────────────────────────────

class District(Base):
    """Maharashtra district master record (36 districts)."""
    __tablename__ = "districts"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    district_id: Mapped[str] = mapped_column(String(10), unique=True, index=True)
    district_name: Mapped[str] = mapped_column(String(100), index=True)
    division: Mapped[str] = mapped_column(String(100), default="")
    state: Mapped[str] = mapped_column(String(100), default="Maharashtra")
    is_prototype: Mapped[str] = mapped_column(String(5), default="No")
    source_page: Mapped[str] = mapped_column(String(10), default="")
    notes: Mapped[str] = mapped_column(Text, default="")


class Sector(Base):
    """Sector taxonomy from MSSDS MSNAS 2023 (41 sectors)."""
    __tablename__ = "sectors"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    sector_id: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    sector_name: Mapped[str] = mapped_column(String(100), index=True)
    sector_aliases: Mapped[str] = mapped_column(Text, default="")
    sector_group: Mapped[str] = mapped_column(String(50), default="")
    review_status: Mapped[str] = mapped_column(String(20), default="Active")


class DistrictIndicator(Base):
    """Individual indicator value: one row per district × sector × indicator_name."""
    __tablename__ = "district_indicators"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    indicator_id: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    district_id: Mapped[str] = mapped_column(String(10), index=True)
    district_name: Mapped[str] = mapped_column(String(100))
    sector_id: Mapped[str] = mapped_column(String(20), index=True)
    sector_name: Mapped[str] = mapped_column(String(100))
    indicator_name: Mapped[str] = mapped_column(String(100), index=True)
    indicator_value: Mapped[int] = mapped_column(Integer, default=0)
    unit: Mapped[str] = mapped_column(String(50), default="")
    reference_period: Mapped[str] = mapped_column(String(20), default="")
    data_type: Mapped[str] = mapped_column(String(50), default="")


class SourceDocument(Base):
    """Data provenance: audit trail for source documents."""
    __tablename__ = "source_documents"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    source_document_id: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    source_title: Mapped[str] = mapped_column(String(300))
    publisher: Mapped[str] = mapped_column(String(200), default="")
    publication_year: Mapped[str] = mapped_column(String(10), default="")
    document_type: Mapped[str] = mapped_column(String(50), default="")
    geographic_coverage: Mapped[str] = mapped_column(String(200), default="")


# ── Skill Knowledge Layer & Taxonomy Models ────────────────────

class JobRole(Base):
    """Industry Job Roles mapped to Sector Taxonomy."""
    __tablename__ = "job_roles"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    role_code: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(200), index=True)
    sector_id: Mapped[str] = mapped_column(String(20), index=True)
    sector_name: Mapped[str] = mapped_column(String(100), index=True)
    qualification: Mapped[str] = mapped_column(String(100), default="Diploma / Degree / ITI")
    experience_level: Mapped[str] = mapped_column(String(50), default="Entry-Level (0-2 yrs)")
    salary_range: Mapped[str] = mapped_column(String(50), default="₹2.5L - ₹5.0L PA")
    demand_level: Mapped[str] = mapped_column(String(20), default="High")  # Very High, High, Moderate
    description: Mapped[str] = mapped_column(Text, default="")
    emerging_status: Mapped[str] = mapped_column(String(20), default="Established")  # Emerging, Established
    skills = relationship("RoleSkill", back_populates="role", cascade="all, delete-orphan")


class RoleSkill(Base):
    """Skills required for specific Job Roles."""
    __tablename__ = "role_skills"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    role_id: Mapped[int] = mapped_column(ForeignKey("job_roles.id"))
    skill_name: Mapped[str] = mapped_column(String(120), index=True)
    category: Mapped[str] = mapped_column(String(50), default="Technical")  # Technical, Tool, Soft, Domain
    importance: Mapped[str] = mapped_column(String(20), default="Critical")  # Critical, Important, Desirable
    proficiency_expected: Mapped[str] = mapped_column(String(30), default="Intermediate")
    role = relationship("JobRole", back_populates="skills")


# ── Institute & Infrastructure Models ─────────────────────────

class Institute(Base):
    """Training Institutes across Maharashtra (ITI, Polytechnics, PMKK, Private)."""
    __tablename__ = "institutes"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    institute_code: Mapped[str] = mapped_column(String(30), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(200), index=True)
    district_id: Mapped[str] = mapped_column(String(10), index=True)
    district_name: Mapped[str] = mapped_column(String(100))
    institute_type: Mapped[str] = mapped_column(String(50), default="Govt ITI")  # Govt ITI, Polytechnic, PMKK, Private ITI
    capacity: Mapped[int] = mapped_column(Integer, default=500)
    enrolled: Mapped[int] = mapped_column(Integer, default=420)
    placement_rate: Mapped[float] = mapped_column(Float, default=68.5)
    contact_email: Mapped[str] = mapped_column(String(100), default="")


class LabEquipment(Base):
    """Lab & Equipment gaps identified per institute/sector."""
    __tablename__ = "lab_equipments"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    institute_name: Mapped[str] = mapped_column(String(200), index=True)
    district_id: Mapped[str] = mapped_column(String(10), index=True)
    district_name: Mapped[str] = mapped_column(String(100))
    sector_name: Mapped[str] = mapped_column(String(100), index=True)
    equipment_name: Mapped[str] = mapped_column(String(200))
    status: Mapped[str] = mapped_column(String(30), default="Missing")  # Available, Needs Upgrade, Missing, Damaged
    required_units: Mapped[int] = mapped_column(Integer, default=1)
    estimated_cost_inr: Mapped[int] = mapped_column(Integer, default=250000)
    impact_on_training: Mapped[str] = mapped_column(String(20), default="High")  # High, Medium, Low


class TrainerProfile(Base):
    """Trainer records, skill gaps and upskilling needs."""
    __tablename__ = "trainers"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    trainer_name: Mapped[str] = mapped_column(String(150))
    institute_name: Mapped[str] = mapped_column(String(200), index=True)
    district_id: Mapped[str] = mapped_column(String(10), index=True)
    district_name: Mapped[str] = mapped_column(String(100))
    sector_name: Mapped[str] = mapped_column(String(100), index=True)
    specialization: Mapped[str] = mapped_column(String(150))
    experience_years: Mapped[int] = mapped_column(Integer, default=5)
    certified: Mapped[str] = mapped_column(String(10), default="Yes")
    upskilling_needed: Mapped[str] = mapped_column(Text, default="")
    training_status: Mapped[str] = mapped_column(String(30), default="Active")


class BatchPerformance(Base):
    """Batch outcomes, pass rate, and placement tracking."""
    __tablename__ = "batch_performances"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    batch_code: Mapped[str] = mapped_column(String(50), index=True)
    institute_name: Mapped[str] = mapped_column(String(200), index=True)
    course_name: Mapped[str] = mapped_column(String(200))
    sector_name: Mapped[str] = mapped_column(String(100), index=True)
    district_name: Mapped[str] = mapped_column(String(100), index=True)
    enrolled_count: Mapped[int] = mapped_column(Integer, default=40)
    certified_count: Mapped[int] = mapped_column(Integer, default=36)
    placed_count: Mapped[int] = mapped_column(Integer, default=28)
    pass_rate: Mapped[float] = mapped_column(Float, default=90.0)
    placement_rate: Mapped[float] = mapped_column(Float, default=70.0)
    avg_salary_pm: Mapped[int] = mapped_column(Integer, default=18500)


# ── Employer Outcomes & Continuous Update Loop ─────────────────

class EmployerOutcome(Base):
    """Outcome feedback from employers to close the continuous loop."""
    __tablename__ = "employer_outcomes"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    employer_name: Mapped[str] = mapped_column(String(200), index=True)
    sector_name: Mapped[str] = mapped_column(String(100), index=True)
    district_name: Mapped[str] = mapped_column(String(100), index=True)
    job_role: Mapped[str] = mapped_column(String(150))
    interviews_held: Mapped[int] = mapped_column(Integer, default=15)
    candidates_hired: Mapped[int] = mapped_column(Integer, default=8)
    satisfaction_score: Mapped[float] = mapped_column(Float, default=4.2)  # out of 5
    avg_salary_inr: Mapped[int] = mapped_column(Integer, default=25000)
    skills_hired: Mapped[Text] = mapped_column(Text, default="")  # comma separated
    reported_skill_gaps: Mapped[Text] = mapped_column(Text, default="")
    employer_feedback: Mapped[Text] = mapped_column(Text, default="")
    retention_rate_pct: Mapped[float] = mapped_column(Float, default=82.0)


# ── Legacy & Supplementary Models (backward compatibility) ─────

class JobPosting(Base):
    __tablename__ = "job_postings"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(200), index=True)
    district: Mapped[str] = mapped_column(String(100), index=True)
    sector: Mapped[str] = mapped_column(String(100), index=True)
    posted_date: Mapped[str] = mapped_column(String(20))
    description: Mapped[Text] = mapped_column(Text)
    source: Mapped[str] = mapped_column(String(100), default="synthetic_demo")
    job_skills = relationship("JobSkill", back_populates="job", cascade="all, delete-orphan")


class Skill(Base):
    __tablename__ = "skills"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    category: Mapped[str] = mapped_column(String(100), default="Technical")
    job_skills = relationship("JobSkill", back_populates="skill", cascade="all, delete-orphan")
    course_skills = relationship("CourseSkill", back_populates="skill", cascade="all, delete-orphan")


class JobSkill(Base):
    __tablename__ = "job_skills"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("job_postings.id"))
    skill_id: Mapped[int] = mapped_column(ForeignKey("skills.id"))
    method: Mapped[str] = mapped_column(String(50), default="dictionary")
    __table_args__ = (UniqueConstraint("job_id", "skill_id"),)
    job = relationship("JobPosting", back_populates="job_skills")
    skill = relationship("Skill", back_populates="job_skills")


class Course(Base):
    __tablename__ = "courses"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(200), index=True)
    district: Mapped[str] = mapped_column(String(100), index=True)
    sector: Mapped[str] = mapped_column(String(100), index=True)
    qualification: Mapped[str] = mapped_column(String(120), default="Certificate")
    seats: Mapped[int] = mapped_column(Integer, default=0)
    trainers: Mapped[int] = mapped_column(Integer, default=0)
    equipment_notes: Mapped[Text] = mapped_column(Text, default="")
    course_skills = relationship("CourseSkill", back_populates="course", cascade="all, delete-orphan")


class CourseSkill(Base):
    __tablename__ = "course_skills"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id"))
    skill_id: Mapped[int] = mapped_column(ForeignKey("skills.id"))
    coverage: Mapped[str] = mapped_column(String(30), default="partial")
    __table_args__ = (UniqueConstraint("course_id", "skill_id"),)
    course = relationship("Course", back_populates="course_skills")
    skill = relationship("Skill", back_populates="course_skills")


class Recommendation(Base):
    __tablename__ = "recommendations"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    district: Mapped[str] = mapped_column(String(100), index=True)
    sector: Mapped[str] = mapped_column(String(100), index=True)
    skill_name: Mapped[str] = mapped_column(String(120))
    action: Mapped[str] = mapped_column(String(250))
    rationale: Mapped[Text] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(30), default="pending")
