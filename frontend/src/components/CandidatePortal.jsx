
import React, { useState, useEffect } from 'react';
import {
  GraduationCap, Target, CheckCircle2, AlertCircle, ArrowRight,
  Sparkles, Briefcase, BookOpen, Layers, Award, Clock,
  ChevronRight, RefreshCw, Send, Check, Search, TrendingUp, UploadCloud
} from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000';

export default function CandidatePortal({ selectedDistrict, setSelectedDistrict }) {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [candidateName, setCandidateName] = useState('Ganesh Sonawane');
  const [education, setEducation] = useState('Bachelor in Computer Engineering');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [resumeText, setResumeText] = useState('');
  const [loadingAssessment, setLoadingAssessment] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState(null);
  const [activeTab, setActiveTab] = useState('assessment'); // 'assessment' | 'pathway' | 'courses' | 'jobs'
  const [isUploading, setIsUploading] = useState(false);

  // Fetch available roles
  useEffect(() => {
    fetch(`${API_BASE}/api/candidate/roles`)
      .then(res => res.json())
      .then(data => {
        setRoles(data);
        if (data.length > 0) {
          setSelectedRole(data[0]);
          // Default pre-select some skills to make it quick
          setSelectedSkills(data[0].skills.slice(0, 2).map(s => s.name));
        }
      })
      .catch(err => console.error("Error loading roles:", err));
  }, []);

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    // Pre-check the first 2 skills as default
    setSelectedSkills(role.skills.slice(0, 2).map(s => s.name));
    setAssessmentResult(null);
  };

  const toggleSkill = (skillName) => {
    setSelectedSkills(prev =>
      prev.includes(skillName)
        ? prev.filter(s => s !== skillName)
        : [...prev, skillName]
    );
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setResumeText('Extracting text from document...');
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch(`${API_BASE}/api/candidate/upload-resume`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setResumeText(data.text);
      } else {
        setResumeText('Failed to extract text. Please paste manually.');
      }
    } catch (err) {
      console.error(err);
      setResumeText('Failed to extract text. Please paste manually.');
    } finally {
      setIsUploading(false);
    }
  };

  const runAssessment = async () => {
    if (!selectedRole) return;
    setLoadingAssessment(true);
    try {
      const res = await fetch(`${API_BASE}/api/candidate/assess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_name: candidateName,
          district: selectedDistrict || 'Pune',
          education: education,
          target_role_id: selectedRole.id,
          target_role_title: selectedRole.title,
          current_skills: selectedSkills,
          resume_or_bio_text: resumeText,
        }),
      });
      const data = await res.json();
      setAssessmentResult(data);
      setActiveTab('pathway');
    } catch (err) {
      console.error("Assessment error:", err);
    } finally {
      setLoadingAssessment(false);
    }
  };

  return (
    <div className="portal-container animate-fade-in">
      {/* Portal Header */}
      <div className="portal-header candidate-gradient">
        <div className="portal-header-left">
          <div className="badge-pill bg-purple-glow">
            <GraduationCap size={16} /> Candidate Competency & Pathway Portal
          </div>
          <h2>Bridge Your Skill Gap to High-Demand Industrial Careers</h2>
          <p>
            AI-driven diagnostic mapping aligned with Maharashtra State Skill Development Society (MSSDS) standards.
            Benchmark your profile, discover missing skills, and follow an accelerated learning pathway.
          </p>
        </div>
        <div className="portal-header-stat">
          <div className="stat-num">{roles.length}</div>
          <div className="stat-lbl">High-Demand Industry Roles Mapped</div>
        </div>
      </div>

      {/* Main Grid: Left Config, Right Output */}
      <div className="candidate-grid">
        {/* Left Column: Target Role & Skill Checklist */}
        <div className="card candidate-config-card">
          <div className="card-header">
            <div>
              <h3>1. Select Target Job Role</h3>
              <p className="subtext">Select an emerging or established role from the MSSDS taxonomy</p>
            </div>
            <span className="badge badge-purple">{selectedRole?.demand_level || 'High'} Demand</span>
          </div>

          <div className="form-group" style={{ margin: '12px 0' }}>
            <select 
              className="select-field" 
              value={selectedRole?.id || ''}
              onChange={(e) => {
                const role = roles.find(r => r.id === e.target.value);
                if (role) handleRoleChange(role);
              }}
              style={{ padding: '12px', fontSize: '13px', fontWeight: '500' }}
            >
              <option value="" disabled>-- Select a Job Role --</option>
              {roles.map(r => (
                <option key={r.id} value={r.id}>
                  {r.title} ({r.sector_name.split(' ')[0]} • {r.salary_range})
                </option>
              ))}
            </select>
          </div>

          {selectedRole && (
            <div className="role-details-box">
              <div className="role-info-row">
                <span><strong>Sector:</strong> {selectedRole.sector_name}</span>
                <span><strong>Min Qual:</strong> {selectedRole.qualification}</span>
              </div>
              <p className="role-desc">{selectedRole.description}</p>
            </div>
          )}

          <div className="divider"></div>

          {/* Candidate Profile Details */}
          <h3>2. Your Current Profile & Competencies</h3>
          <div className="form-group-row">
            <div className="form-group">
              <label>Candidate Name</label>
              <input
                type="text"
                value={candidateName}
                onChange={e => setCandidateName(e.target.value)}
                className="input-field"
              />
            </div>
            <div className="form-group">
              <label>Education / Stream</label>
              <input
                type="text"
                value={education}
                onChange={e => setEducation(e.target.value)}
                className="input-field"
              />
            </div>
          </div>

          <div className="skills-checklist-section">
            <label className="section-label">
              Check skills you already possess for <strong>{selectedRole?.title}</strong>:
            </label>
            <div className="skills-checkbox-grid">
              {selectedRole?.skills.map((s, idx) => {
                const isChecked = selectedSkills.includes(s.name);
                return (
                  <div
                    key={idx}
                    className={`skill-check-card ${isChecked ? 'checked' : ''}`}
                    onClick={() => toggleSkill(s.name)}
                  >
                    <div className="check-box">
                      {isChecked && <Check size={14} color="#fff" />}
                    </div>
                    <div className="skill-check-info">
                      <span className="skill-check-title">{s.name}</span>
                      <span className="skill-check-meta">
                        {s.category} • <em className={s.importance === 'Critical' ? 'text-red' : ''}>{s.importance}</em>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="resume-paste-section" style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
              <label className="section-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={14} className="text-purple" /> Paste Resume (or Upload PDF/TXT)
              </label>
              <div>
                <input 
                  type="file" 
                  id="resume-upload" 
                  accept=".txt,.pdf" 
                  style={{ display: 'none' }} 
                  onChange={handleFileUpload} 
                />
                <label htmlFor="resume-upload" className="btn btn-outline btn-sm" style={{ cursor: 'pointer', padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                  {isUploading ? <RefreshCw size={14} className="spin" /> : <UploadCloud size={14} />}
                  {isUploading ? 'Uploading...' : 'Upload File'}
                </label>
              </div>
            </div>
            <textarea
              className="textarea-field"
              rows={4}
              placeholder="e.g. B.E. in Computer Engineering. Familiar with React, Node.js, Python, and cloud deployment on AWS. Completed an internship developing web apps..."
              value={resumeText}
              onChange={e => setResumeText(e.target.value)}
            />
          </div>

          <button
            className="btn btn-primary btn-block run-btn"
            onClick={runAssessment}
            disabled={loadingAssessment}
          >
            {loadingAssessment ? (
              <><RefreshCw size={18} className="spin" /> Analyzing via Gemini AI...</>
            ) : (
              <><Sparkles size={18} /> Analyze Skill Gap & Generate Pathway</>
            )}
          </button>
        </div>

        {/* Right Column: Assessment Results & Learning Pathway */}
        <div className="candidate-results-column">
          {assessmentResult ? (
            <div className="results-wrapper animate-slide-up">
              {/* Score Banner */}
              <div className="card score-banner-card">
                <div className="score-main">
                  <div className="circular-progress">
                    <span className="score-percentage">{assessmentResult.match_percentage}%</span>
                    <span className="score-sub">Match Score</span>
                  </div>
                  <div className="score-details">
                    <div className="badge-row">
                      <span className="badge badge-success">
                        <CheckCircle2 size={13} /> {assessmentResult.matched_skills.length} Competencies Met
                      </span>
                      <span className="badge badge-danger">
                        <AlertCircle size={13} /> {assessmentResult.missing_skills.length} Gaps to Bridge
                      </span>
                      {assessmentResult.ai_powered && (
                        <span className="badge badge-ai">
                          <Sparkles size={13} /> Gemini 2.5 Flash Verified
                        </span>
                      )}
                    </div>
                    <h3>Target: {assessmentResult.target_role.title}</h3>
                    <p className="text-muted">
                      Expected Compensation: <strong>{assessmentResult.target_role.salary_range}</strong> | Sector: {assessmentResult.target_role.sector}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabs for Pathway, Courses, Jobs */}
              <div className="result-nav-tabs">
                <button
                  className={`tab-btn ${activeTab === 'pathway' ? 'active' : ''}`}
                  onClick={() => setActiveTab('pathway')}
                >
                  <Layers size={16} /> 4-Phase Learning Pathway
                </button>
                <button
                  className={`tab-btn ${activeTab === 'gaps' ? 'active' : ''}`}
                  onClick={() => setActiveTab('gaps')}
                >
                  <AlertCircle size={16} /> Skill Gap Breakdown
                </button>
                <button
                  className={`tab-btn ${activeTab === 'courses' ? 'active' : ''}`}
                  onClick={() => setActiveTab('courses')}
                >
                  <BookOpen size={16} /> Recommended Courses ({assessmentResult.recommended_courses.length})
                </button>
                <button
                  className={`tab-btn ${activeTab === 'jobs' ? 'active' : ''}`}
                  onClick={() => setActiveTab('jobs')}
                >
                  <Briefcase size={16} /> Matching Jobs ({assessmentResult.matching_jobs.length})
                </button>
              </div>

              {/* Tab 1: Learning Pathway */}
              {activeTab === 'pathway' && (
                <div className="card tab-content-card">
                  <div className="pathway-timeline">
                    {assessmentResult.learning_pathway.map((step, idx) => (
                      <div key={idx} className="timeline-step">
                        <div className="timeline-marker">
                          <span className="step-number">{step.step || idx + 1}</span>
                        </div>
                        <div className="timeline-content">
                          <div className="step-header">
                            <h4>{step.milestone || `Phase ${idx + 1}`}</h4>
                            <span className="step-duration">
                              <Clock size={13} /> {step.estimated_duration || '3 weeks'}
                            </span>
                          </div>
                          <p className="step-action">{step.action}</p>
                          {step.focus_skills && step.focus_skills.length > 0 && (
                            <div className="focus-skills-row">
                              <strong>Key Focus:</strong>
                              {step.focus_skills.map((fs, i) => (
                                <span key={i} className="skill-chip">{fs}</span>
                              ))}
                            </div>
                          )}
                          {step.recommended_project && (
                            <div className="project-highlight">
                              <strong>🛠️ Capstone Project:</strong> {step.recommended_project}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 2: Skill Gap Breakdown */}
              {activeTab === 'gaps' && (
                <div className="card tab-content-card">
                  <div className="skills-split-view">
                    <div className="split-column">
                      <h4 className="text-success"><CheckCircle2 size={16} /> Validated Skills ({assessmentResult.matched_skills.length})</h4>
                      <div className="skill-tags-list">
                        {assessmentResult.matched_skills.map((s, idx) => (
                          <div key={idx} className="validated-tag">
                            <strong>{s.name}</strong>
                            <span>{s.proficiency || 'Proficient'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="split-column">
                      <h4 className="text-danger"><AlertCircle size={16} /> Missing High-Impact Gaps ({assessmentResult.missing_skills.length})</h4>
                      <div className="skill-tags-list">
                        {assessmentResult.missing_skills.map((s, idx) => (
                          <div key={idx} className="missing-tag">
                            <div className="missing-tag-header">
                              <strong>{s.name}</strong>
                              <span className={`importance-tag ${s.importance === 'Critical' ? 'tag-crit' : 'tag-imp'}`}>
                                {s.importance}
                              </span>
                            </div>
                            <span className="prof-req">Target proficiency: {s.proficiency}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Recommended Courses */}
              {activeTab === 'courses' && (
                <div className="card tab-content-card">
                  <div className="courses-grid-cards">
                    {assessmentResult.recommended_courses.map((c, idx) => (
                      <div key={idx} className="course-card-item">
                        <div className="course-card-top">
                          <span className="badge badge-purple">{c.sector}</span>
                          <span className="course-seats">{c.seats} Seats Available</span>
                        </div>
                        <h4>{c.name}</h4>
                        <div className="course-meta-row">
                          <span>📍 {c.district}</span>
                          <span>📜 {c.qualification}</span>
                        </div>
                        <button className="btn btn-outline btn-sm">
                          View Institute Syllabus <ChevronRight size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 4: Matching Jobs */}
              {activeTab === 'jobs' && (
                <div className="card tab-content-card">
                  <div className="jobs-list-cards">
                    {assessmentResult.matching_jobs.map((j, idx) => (
                      <div key={idx} className="job-card-item">
                        <div className="job-card-info">
                          <h4>{j.title}</h4>
                          <div className="job-meta-row">
                            <span>🏢 Maharashtra Industrial Cluster</span>
                            <span>📍 {j.district}</span>
                            <span>🏷️ {j.sector}</span>
                          </div>
                        </div>
                        <button className="btn btn-primary btn-sm">
                          Apply via MahaSwayam <ArrowRight size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card empty-state-card">
              <div className="empty-icon-wrap">
                <Target size={48} className="text-purple" />
              </div>
              <h3>Ready for Your Career Diagnosis</h3>
              <p>
                Select your target job role on the left and check off any skills you currently have,
                or paste your resume text. Click <strong>"Analyze Skill Gap & Generate Pathway"</strong> to receive
                an AI-generated milestone roadmap, gap scores, accredited courses, and job matches.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
