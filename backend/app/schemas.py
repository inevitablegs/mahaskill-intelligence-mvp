
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class ReviewRequest(BaseModel):
    status: str = Field(pattern="^(approved|rejected|pending)$")

class SkillExtractionRequest(BaseModel):
    text: str
    sector_context: Optional[str] = ""

class JobClassificationRequest(BaseModel):
    job_title: str
    job_description: Optional[str] = ""

class CandidateAssessmentRequest(BaseModel):
    candidate_name: str = "Trainee"
    district: str = "Pune"
    education: str = "Diploma Mechanical"
    target_role_id: Optional[int] = None
    target_role_title: Optional[str] = None
    current_skills: List[str] = []
    resume_or_bio_text: Optional[str] = ""

class CurriculumModernizationRequest(BaseModel):
    course_name: str
    sector_name: str
    district_name: Optional[str] = "Pune"
    current_topics: List[str] = []

class PolicySimulationRequest(BaseModel):
    district_id: str
    seat_reallocations: Dict[str, int] = {}  # sector_name -> seats_delta (+50, -30)
    additional_funding_lakhs: float = 0.0

class EmployerFeedbackRequest(BaseModel):
    employer_name: str
    sector_name: str
    district_name: str
    job_role: str
    interviews_held: int = 10
    candidates_hired: int = 5
    satisfaction_score: float = 4.0
    avg_salary_inr: int = 25000
    skills_hired: str = ""
    reported_skill_gaps: str = ""
    employer_feedback: str = ""

class SetApiKeyRequest(BaseModel):
    api_key: str
