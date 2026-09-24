
"""
Data seeding pipeline for MahaSkill Intelligence.

Loads real MSSDS datasets from root-level CSV files:
  - Source_Register.csv   → source_documents table
  - District_Master.csv   → districts table
  - Sector_Taxonomy.csv   → sectors table
  - District_Indicators.csv → district_indicators table

Also populates the Skill Knowledge Layer:
  - job_roles & role_skills
  - institutes, lab_equipments, trainers, batch_performances
  - employer_outcomes (closing the continuous loop)
"""

import csv
from pathlib import Path
from sqlalchemy import select
from .models import (
    District, Sector, DistrictIndicator, SourceDocument,
    JobPosting, Course, Skill, CourseSkill,
    JobRole, RoleSkill, Institute, LabEquipment,
    TrainerProfile, BatchPerformance, EmployerOutcome,
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

    print("[SEED] Loaded real MSSDS baseline data successfully.")


def seed_skill_knowledge_layer(db):
    """Seed contextual roles, role skills, institutes, lab equipment, trainers, and employer feedback."""
    if db.scalar(select(JobRole.id).limit(1)) is not None:
        return

    # 1. Job Roles & Role Skills
    roles_data = [
        {
            "role_code": "JR_AUTO_EV_01",
            "title": "EV Battery & Powertrain Technician",
            "sector_id": "SEC_AUTO",
            "sector_name": "Automotive and Auto Components",
            "qualification": "ITI / Diploma (Electrical / Automobile)",
            "experience_level": "0-2 years",
            "salary_range": "₹3.2L - ₹4.8L PA",
            "demand_level": "Very High",
            "emerging_status": "Emerging",
            "description": "Diagnose, service, and maintain Lithium-ion battery packs, BMS, and high-voltage drive systems in commercial and passenger electric vehicles.",
            "skills": [
                ("High Voltage Safety & Disconnect", "Technical", "Critical", "Advanced"),
                ("BMS Diagnostics & CAN Bus", "Tool", "Critical", "Intermediate"),
                ("Battery Cell Balancing", "Technical", "Critical", "Intermediate"),
                ("Thermal Management Systems", "Technical", "Important", "Intermediate"),
                ("Automotive Wiring & Schematics", "Technical", "Important", "Advanced"),
                ("Safety Protocols (AIS-038/156)", "Domain", "Important", "Intermediate"),
                ("Problem Solving & Troubleshooting", "Soft", "Desirable", "Intermediate"),
            ],
        },
        {
            "role_code": "JR_MANUF_CNC_02",
            "title": "CNC 5-Axis Programmer & Operator",
            "sector_id": "SEC_CAPGOODS",
            "sector_name": "Capital Goods",
            "qualification": "ITI Machinist / Diploma Mechanical",
            "experience_level": "1-3 years",
            "salary_range": "₹3.5L - ₹5.5L PA",
            "demand_level": "Very High",
            "emerging_status": "Emerging",
            "description": "Setup, program, and operate 5-axis CNC machining centers using Mastercam/Siemens NX for precision aerospace and automotive components.",
            "skills": [
                ("G-Code & M-Code Programming", "Technical", "Critical", "Advanced"),
                ("Siemens NX CAM / Mastercam", "Tool", "Critical", "Intermediate"),
                ("Precision Measurement (CMM / Vernier)", "Technical", "Critical", "Advanced"),
                ("GD&T Tolerancing", "Domain", "Critical", "Intermediate"),
                ("Cutting Tool Selection & Speeds", "Technical", "Important", "Intermediate"),
                ("Machine Maintenance & Calibration", "Technical", "Important", "Intermediate"),
            ],
        },
        {
            "role_code": "JR_ELEC_PLC_03",
            "title": "Industrial Automation & PLC Engineer",
            "sector_id": "SEC_ELECTRONICS",
            "sector_name": "Electronics and Hardware",
            "qualification": "Diploma / B.E. (Instrumentation / Electrical / Mechatronics)",
            "experience_level": "0-2 years",
            "salary_range": "₹3.8L - ₹6.0L PA",
            "demand_level": "Very High",
            "emerging_status": "Emerging",
            "description": "Design and troubleshoot PLC ladder logic (Siemens/Allen-Bradley), SCADA systems, industrial sensors, and robotic integration on assembly lines.",
            "skills": [
                ("PLC Ladder Logic Programming", "Technical", "Critical", "Advanced"),
                ("SCADA & HMI Configuration", "Technical", "Critical", "Intermediate"),
                ("Industrial Sensors & Actuators", "Technical", "Critical", "Intermediate"),
                ("VFD Drives & Motor Control", "Technical", "Important", "Intermediate"),
                ("Modbus / Profinet Protocols", "Domain", "Important", "Intermediate"),
                ("Troubleshooting & Root Cause Analysis", "Soft", "Important", "Intermediate"),
            ],
        },
        {
            "role_code": "JR_IT_FS_04",
            "title": "Full Stack Web & Cloud Developer",
            "sector_id": "SEC_IT",
            "sector_name": "IT and IT-ES",
            "qualification": "B.Sc IT / BCA / B.Tech / Diploma CS",
            "experience_level": "0-2 years",
            "salary_range": "₹4.5L - ₹7.5L PA",
            "demand_level": "Very High",
            "emerging_status": "Established",
            "description": "Develop full-stack web applications with modern frontend frameworks (React), Node.js/Python microservices, and deploy on AWS cloud.",
            "skills": [
                ("React.js & Modern JavaScript", "Technical", "Critical", "Advanced"),
                ("REST APIs & Python/Node.js", "Technical", "Critical", "Advanced"),
                ("SQL & PostgreSQL Database Design", "Technical", "Critical", "Intermediate"),
                ("Git & CI/CD Pipelines", "Tool", "Important", "Intermediate"),
                ("AWS Fundamentals (S3, EC2)", "Domain", "Important", "Intermediate"),
                ("Agile & Team Collaboration", "Soft", "Important", "Intermediate"),
            ],
        },
        {
            "role_code": "JR_HEALTH_GDA_05",
            "title": "General Duty Medical Assistant (GDA)",
            "sector_id": "SEC_HEALTHCARE",
            "sector_name": "Healthcare",
            "qualification": "12th Science / ANM / Certified GDA",
            "experience_level": "0-1 years",
            "salary_range": "₹2.2L - ₹3.4L PA",
            "demand_level": "High",
            "emerging_status": "Established",
            "description": "Provide direct patient care assistance, monitor vitals, sterilize medical equipment, and support nursing staff in hospitals and diagnostic centers.",
            "skills": [
                ("Patient Vitals Monitoring", "Technical", "Critical", "Advanced"),
                ("Infection Control & Bio-Waste", "Domain", "Critical", "Advanced"),
                ("Emergency First Aid & CPR", "Technical", "Critical", "Advanced"),
                ("Medical Record Entry", "Tool", "Important", "Intermediate"),
                ("Compassionate Communication", "Soft", "Critical", "Advanced"),
            ],
        },
        {
            "role_code": "JR_FOOD_QA_06",
            "title": "Food Processing Quality Analyst",
            "sector_id": "SEC_FOODPROC",
            "sector_name": "Food Processing",
            "qualification": "B.Sc Food Tech / Diploma Agriculture / ITI",
            "experience_level": "0-2 years",
            "salary_range": "₹2.8L - ₹4.2L PA",
            "demand_level": "High",
            "emerging_status": "Established",
            "description": "Inspect raw agricultural produce, test food parameters for FSSAI compliance, manage cleanroom packaging lines, and ensure HACCP standards.",
            "skills": [
                ("FSSAI & HACCP Standards", "Domain", "Critical", "Advanced"),
                ("Food Quality Testing & Titration", "Technical", "Critical", "Intermediate"),
                ("Packaging Rig Operations", "Technical", "Important", "Intermediate"),
                ("Cold Chain Temperature Logging", "Technical", "Important", "Intermediate"),
                ("Audit Documentation", "Soft", "Important", "Intermediate"),
            ],
        },
        {
            "role_code": "JR_LOG_SUP_07",
            "title": "Smart Warehouse & Supply Chain Supervisor",
            "sector_id": "SEC_LOGISTICS",
            "sector_name": "Logistics",
            "qualification": "Any Graduate / Diploma / ITI",
            "experience_level": "1-2 years",
            "salary_range": "₹3.0L - ₹4.5L PA",
            "demand_level": "High",
            "emerging_status": "Emerging",
            "description": "Coordinate automated warehouse operations, manage WMS barcode/RFID scanning, optimize dock schedules, and oversee dispatch quality.",
            "skills": [
                ("WMS & ERP Systems (SAP/Oracle)", "Tool", "Critical", "Intermediate"),
                ("Inventory Audit & Cycle Counting", "Technical", "Critical", "Advanced"),
                ("RFID & Barcode Scanner Systems", "Tool", "Important", "Intermediate"),
                ("Fleet Routing Optimization", "Domain", "Important", "Intermediate"),
                ("Team Leadership & Shift Mgmt", "Soft", "Critical", "Intermediate"),
            ],
        },
        {
            "role_code": "JR_GREEN_SOLAR_08",
            "title": "Solar PV Rooftop System Installer & Auditor",
            "sector_id": "SEC_RENEWABLE",
            "sector_name": "Green Jobs",
            "qualification": "ITI Electrician / Wireman / Diploma Electrical",
            "experience_level": "0-2 years",
            "salary_range": "₹2.8L - ₹4.2L PA",
            "demand_level": "High",
            "emerging_status": "Emerging",
            "description": "Install, wire, test, and commission rooftop and grid-tied solar photovoltaic systems and energy storage inverters.",
            "skills": [
                ("Solar PV Panel Installation", "Technical", "Critical", "Advanced"),
                ("Inverter & Net-Metering Wiring", "Technical", "Critical", "Advanced"),
                ("Earthing & Lightning Protection", "Technical", "Important", "Intermediate"),
                ("Solar Radiation Angle Audit", "Domain", "Important", "Intermediate"),
                ("High-Altitude Safety & PPE", "Soft", "Critical", "Advanced"),
            ],
        },
    ]

    for rdata in roles_data:
        skills = rdata.pop("skills")
        role = JobRole(**rdata)
        db.add(role)
        db.flush()
        for s_name, s_cat, s_imp, s_prof in skills:
            db.add(RoleSkill(
                role_id=role.id,
                skill_name=s_name,
                category=s_cat,
                importance=s_imp,
                proficiency_expected=s_prof,
            ))
    db.commit()

    # 2. Institutes
    institutes_data = [
        {"institute_code": "INST_PUN_01", "name": "Government ITI Aundh", "district_id": "D001", "district_name": "Pune", "institute_type": "Govt ITI", "capacity": 1200, "enrolled": 1140, "placement_rate": 78.4, "contact_email": "iti.aundh@mahasports.gov.in"},
        {"institute_code": "INST_MUM_02", "name": "Government ITI Mulund", "district_id": "D002", "district_name": "Mumbai Suburban", "institute_type": "Govt ITI", "capacity": 950, "enrolled": 890, "placement_rate": 81.2, "contact_email": "iti.mulund@mahasports.gov.in"},
        {"institute_code": "INST_NAG_03", "name": "Government ITI Nagpur", "district_id": "D003", "district_name": "Nagpur", "institute_type": "Govt ITI", "capacity": 850, "enrolled": 760, "placement_rate": 71.0, "contact_email": "iti.nagpur@mahasports.gov.in"},
        {"institute_code": "INST_PUN_POLY", "name": "Government Polytechnic Pune", "district_id": "D001", "district_name": "Pune", "institute_type": "Polytechnic", "capacity": 1400, "enrolled": 1380, "placement_rate": 84.6, "contact_email": "principal@gppune.ac.in"},
        {"institute_code": "INST_NAS_01", "name": "Government ITI Nashik (Satpur)", "district_id": "D004", "district_name": "Nashik", "institute_type": "Govt ITI", "capacity": 800, "enrolled": 720, "placement_rate": 69.5, "contact_email": "iti.satpur@mahasports.gov.in"},
        {"institute_code": "INST_AUR_PMKK", "name": "PMKK Skill Hub Chhatrapati Sambhajinagar", "district_id": "D005", "district_name": "Chhatrapati Sambhajinagar", "institute_type": "PMKK", "capacity": 600, "enrolled": 510, "placement_rate": 64.0, "contact_email": "pmkk.aurangabad@skillindia.org"},
    ]
    for inst in institutes_data:
        db.add(Institute(**inst))
    db.commit()

    # 3. Lab Equipment Gaps
    equipments_data = [
        {"institute_name": "Government ITI Aundh", "district_id": "D001", "district_name": "Pune", "sector_name": "Automotive and Auto Components", "equipment_name": "EV Battery Diagnostic & Balancing Rig", "status": "Missing", "required_units": 2, "estimated_cost_inr": 850000, "impact_on_training": "High"},
        {"institute_name": "Government ITI Aundh", "district_id": "D001", "district_name": "Pune", "sector_name": "Capital Goods", "equipment_name": "5-Axis CNC Milling Simulation Center", "status": "Needs Upgrade", "required_units": 1, "estimated_cost_inr": 1500000, "impact_on_training": "High"},
        {"institute_name": "Government ITI Mulund", "district_id": "D002", "district_name": "Mumbai Suburban", "sector_name": "IT and IT-ES", "equipment_name": "High-Performance Cloud Development Workstations", "status": "Needs Upgrade", "required_units": 30, "estimated_cost_inr": 1800000, "impact_on_training": "High"},
        {"institute_name": "Government ITI Mulund", "district_id": "D002", "district_name": "Mumbai Suburban", "sector_name": "Healthcare", "equipment_name": "Advanced Patient Simulator & ICU Bed Setup", "status": "Missing", "required_units": 2, "estimated_cost_inr": 650000, "impact_on_training": "High"},
        {"institute_name": "Government ITI Nagpur", "district_id": "D003", "district_name": "Nagpur", "sector_name": "Electronics and Hardware", "equipment_name": "Siemens S7-1200 Modular PLC Training Racks", "status": "Missing", "required_units": 4, "estimated_cost_inr": 720000, "impact_on_training": "High"},
        {"institute_name": "Government ITI Nagpur", "district_id": "D003", "district_name": "Nagpur", "sector_name": "Green Jobs", "equipment_name": "Grid-Tied Solar Inverter & Net-Metering Rig", "status": "Needs Upgrade", "required_units": 2, "estimated_cost_inr": 480000, "impact_on_training": "Medium"},
    ]
    for eq in equipments_data:
        db.add(LabEquipment(**eq))
    db.commit()

    # 4. Trainer Profiles
    trainers_data = [
        {"trainer_name": "Rajesh Deshmukh", "institute_name": "Government ITI Aundh", "district_id": "D001", "district_name": "Pune", "sector_name": "Automotive and Auto Components", "specialization": "Internal Combustion Engines & Hydraulics", "experience_years": 12, "certified": "Yes", "upskilling_needed": "High Voltage Safety, Lithium-ion BMS Protocols, EV CAN Bus", "training_status": "Upskilling Recommended"},
        {"trainer_name": "Sunita Patil", "institute_name": "Government ITI Aundh", "district_id": "D001", "district_name": "Pune", "sector_name": "Capital Goods", "specialization": "Conventional Lathe & 3-Axis CNC Milling", "experience_years": 8, "certified": "Yes", "upskilling_needed": "5-Axis CAD/CAM Mastercam programming & Toolpath optimization", "training_status": "Active"},
        {"trainer_name": "Amit Kulkarni", "institute_name": "Government ITI Mulund", "district_id": "D002", "district_name": "Mumbai Suburban", "sector_name": "IT and IT-ES", "specialization": "Core Java & HTML/CSS", "experience_years": 6, "certified": "Yes", "upskilling_needed": "Modern React 18, Node.js Microservices, AWS Cloud Practitioner", "training_status": "Upskilling Scheduled"},
        {"trainer_name": "Dr. Meenakshi Joshi", "institute_name": "Government ITI Mulund", "district_id": "D002", "district_name": "Mumbai Suburban", "sector_name": "Healthcare", "specialization": "General Nursing & First Aid", "experience_years": 14, "certified": "Yes", "upskilling_needed": "ICU Ventilator Basics, Electronic Health Records (ABDM)", "training_status": "Active"},
        {"trainer_name": "Pravin Shinde", "institute_name": "Government ITI Nagpur", "district_id": "D003", "district_name": "Nagpur", "sector_name": "Electronics and Hardware", "specialization": "Relay Logic & Basic Electric Wiring", "experience_years": 9, "certified": "Yes", "upskilling_needed": "PLC Ladder Programming (Siemens TIA Portal), SCADA Integration", "training_status": "Upskilling Recommended"},
    ]
    for tr in trainers_data:
        db.add(TrainerProfile(**tr))
    db.commit()

    # 5. Batch Performance
    batches_data = [
        {"batch_code": "BATCH-PUN-AUTO-2023A", "institute_name": "Government ITI Aundh", "course_name": "Automotive Mechatronics & EV Basics", "sector_name": "Automotive and Auto Components", "district_name": "Pune", "enrolled_count": 45, "certified_count": 42, "placed_count": 36, "pass_rate": 93.3, "placement_rate": 80.0, "avg_salary_pm": 22500},
        {"batch_code": "BATCH-PUN-CNC-2023B", "institute_name": "Government ITI Aundh", "course_name": "Advanced CNC Machinist", "sector_name": "Capital Goods", "district_name": "Pune", "enrolled_count": 50, "certified_count": 48, "placed_count": 44, "pass_rate": 96.0, "placement_rate": 88.0, "avg_salary_pm": 26000},
        {"batch_code": "BATCH-MUM-IT-2023A", "institute_name": "Government ITI Mulund", "course_name": "Full Stack Web Development", "sector_name": "IT and IT-ES", "district_name": "Mumbai Suburban", "enrolled_count": 60, "certified_count": 55, "placed_count": 48, "pass_rate": 91.6, "placement_rate": 80.0, "avg_salary_pm": 28000},
        {"batch_code": "BATCH-MUM-HLTH-2023C", "institute_name": "Government ITI Mulund", "course_name": "General Duty Healthcare Assistant", "sector_name": "Healthcare", "district_name": "Mumbai Suburban", "enrolled_count": 40, "certified_count": 39, "placed_count": 35, "pass_rate": 97.5, "placement_rate": 87.5, "avg_salary_pm": 20000},
        {"batch_code": "BATCH-NAG-ELEC-2023A", "institute_name": "Government ITI Nagpur", "course_name": "Industrial Automation & Electrician", "sector_name": "Electronics and Hardware", "district_name": "Nagpur", "enrolled_count": 45, "certified_count": 38, "placed_count": 27, "pass_rate": 84.4, "placement_rate": 60.0, "avg_salary_pm": 18000},
        {"batch_code": "BATCH-NAG-SOLAR-2023B", "institute_name": "Government ITI Nagpur", "course_name": "Solar PV Rooftop Technician", "sector_name": "Green Jobs", "district_name": "Nagpur", "enrolled_count": 35, "certified_count": 32, "placed_count": 22, "pass_rate": 91.4, "placement_rate": 62.8, "avg_salary_pm": 17500},
    ]
    for b in batches_data:
        db.add(BatchPerformance(**b))
    db.commit()

    # 6. Employer Outcomes (Continuous Update Loop)
    outcomes_data = [
        {
            "employer_name": "Tata Motors Ltd",
            "sector_name": "Automotive and Auto Components",
            "district_name": "Pune",
            "job_role": "EV Assembly & Diagnostic Associate",
            "interviews_held": 48,
            "candidates_hired": 32,
            "satisfaction_score": 4.4,
            "avg_salary_inr": 28000,
            "skills_hired": "High Voltage Safety, Wire Harnessing, Torque Tools, Diagnostic Scanners",
            "reported_skill_gaps": "Need deeper practical training in CAN bus error logging and battery cell temperature differential checks.",
            "employer_feedback": "Candidates show good theoretical foundation and safety discipline. Recommend 30 extra lab hours on live EV battery benches.",
            "retention_rate_pct": 89.5,
        },
        {
            "employer_name": "Bharat Forge Ltd",
            "sector_name": "Capital Goods",
            "district_name": "Pune",
            "job_role": "CNC 5-Axis Operator",
            "interviews_held": 35,
            "candidates_hired": 24,
            "satisfaction_score": 4.6,
            "avg_salary_inr": 31000,
            "skills_hired": "Siemens Control, G-code Editing, CMM Inspection, Tool Offset Setting",
            "reported_skill_gaps": "Experience with modern titanium/alloy cutting speeds and 5-axis collision avoidance simulation.",
            "employer_feedback": "Graduates from Aundh ITI performed exceptionally well. Ready to absorb another 40 trainees if 5-axis training continues.",
            "retention_rate_pct": 92.0,
        },
        {
            "employer_name": "Persistent Systems",
            "sector_name": "IT and IT-ES",
            "district_name": "Pune",
            "job_role": "Junior Full Stack Engineer",
            "interviews_held": 60,
            "candidates_hired": 28,
            "satisfaction_score": 4.1,
            "avg_salary_inr": 38000,
            "skills_hired": "React, TypeScript, REST APIs, Git, PostgreSQL",
            "reported_skill_gaps": "Automated unit testing (Jest/Pytest) and cloud deployment awareness.",
            "employer_feedback": "Good problem-solving attitude. Would benefit from adding Docker & GitHub Actions to the syllabus.",
            "retention_rate_pct": 84.0,
        },
        {
            "employer_name": "Kokilaben Dhirubhai Ambani Hospital",
            "sector_name": "Healthcare",
            "district_name": "Mumbai Suburban",
            "job_role": "General Duty Medical Assistant",
            "interviews_held": 40,
            "candidates_hired": 34,
            "satisfaction_score": 4.7,
            "avg_salary_inr": 24000,
            "skills_hired": "Vitals Monitoring, Patient Hygiene, Sterilization, CPR",
            "reported_skill_gaps": "Familiarity with digital hospital information management systems (HIMS).",
            "employer_feedback": "Punctual, disciplined, and very empathetic. Highly recommend increasing batch capacity by 50% in Mumbai.",
            "retention_rate_pct": 94.0,
        },
        {
            "employer_name": "Mahindra & Mahindra Farm Equipment",
            "sector_name": "Automotive and Auto Components",
            "district_name": "Nagpur",
            "job_role": "Automation Technician",
            "interviews_held": 30,
            "candidates_hired": 18,
            "satisfaction_score": 3.9,
            "avg_salary_inr": 22000,
            "skills_hired": "Hydraulic Circuit Assembly, Basic PLC Troubleshooting, Sensor Mounting",
            "reported_skill_gaps": "Hands-on experience with modern Siemens TIA portal and servo drives.",
            "employer_feedback": "Basic electrical understanding is solid. Institute needs updated PLC racks to match our assembly lines.",
            "retention_rate_pct": 78.0,
        },
    ]
    for out in outcomes_data:
        db.add(EmployerOutcome(**out))
    db.commit()

    print("[SEED] Seeded complete Skill Knowledge Layer & Feedback Loop successfully.")


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
    """Seed both real MSSDS data, skill knowledge layer, and legacy demo data."""
    seed_real_data(db)
    seed_skill_knowledge_layer(db)
    seed_legacy_data(db)
