
from sqlalchemy import String, Integer, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base

class JobPosting(Base):
    __tablename__ = "job_postings"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(200), index=True)
    district: Mapped[str] = mapped_column(String(100), index=True)
    sector: Mapped[str] = mapped_column(String(100), index=True)
    posted_date: Mapped[str] = mapped_column(String(20))
    description: Mapped[str] = mapped_column(Text)
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
    equipment_notes: Mapped[str] = mapped_column(Text, default="")
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
    rationale: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(30), default="pending")
