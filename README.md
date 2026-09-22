
# MahaSkill Intelligence — SIH MVP

A demo-only full-stack prototype for exploring labour-market skill signals and comparing them with training-course coverage across Pune, Nashik, and Nagpur.

## Stack
- Frontend: React + Vite
- Backend: FastAPI + SQLAlchemy
- Database: SQLite by default (easy local demo); PostgreSQL-ready via `DATABASE_URL`
- Analytics: deterministic Python skill dictionary + transparent demand/gap rules

> **Data notice:** Included records are synthetic and illustrative. They are not verified labour-market statistics or official MSSDS data. Do not present demo values as actual vacancies, placements, or statewide findings.

## Project structure
```text
mahaskill-intelligence/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── seed.py
│   │   └── services/intelligence.py
│   ├── data/
│   │   ├── job_postings.csv
│   │   ├── courses.csv
│   │   └── course_skills.csv
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── src/App.jsx
    ├── src/main.jsx
    ├── src/styles.css
    ├── package.json
    └── vite.config.js
```

## Run locally

### 1. Backend
Requires Python 3.10+.

```bash
cd backend
python -m venv .venv
# Windows:
.venv\\Scripts\\activate
# macOS/Linux:
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API docs: http://127.0.0.1:8000/docs

The app seeds a local SQLite database on startup with the included demo records.

### 2. Frontend
In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

The frontend expects the API at `http://127.0.0.1:8000`. Set `VITE_API_BASE_URL` if needed.

## Core API endpoints
- `GET /api/health`
- `GET /api/filters`
- `GET /api/overview?district=Pune&sector=Automotive%20%2F%20EV`
- `GET /api/demand?district=Pune&sector=Automotive%20%2F%20EV`
- `GET /api/gaps?district=Pune&sector=Automotive%20%2F%20EV`
- `GET /api/recommendations?district=Pune&sector=Automotive%20%2F%20EV`
- `GET /api/jobs?district=Pune&sector=Automotive%20%2F%20EV`
- `GET /api/courses?district=Pune&sector=Automotive%20%2F%20EV`
- `POST /api/review/{recommendation_id}` with `{"status":"approved"}` or `{"status":"rejected"}`

## Data model
- District
- Sector
- JobPosting
- Skill
- JobSkill (posting-to-skill evidence)
- Course
- CourseSkill (course coverage mapping)
- TrainingCapacity
- Recommendation

## Intelligence logic (v1)
1. Match known skill phrases in job descriptions using a curated alias dictionary.
2. Count distinct demo postings mentioning each skill.
3. Compare demand share with course mapping coverage.
4. Flag skills as potential gaps when demand signal is high and coverage is absent/partial.
5. Generate recommendations with an explicit rationale and a review status.

The current prototype does not forecast actual employment, infer total vacancies, or make automatic policy decisions.

## Replace demo data
Edit the CSV files in `backend/data/`, then restart the backend. For production ingestion, add authentication, validation, audit logs, data licensing checks, privacy controls, and a reviewed source registry before accepting real datasets.
