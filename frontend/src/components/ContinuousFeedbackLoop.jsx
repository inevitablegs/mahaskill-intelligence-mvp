
import React, { useState, useEffect } from 'react';
import {
  RotateCcw, ThumbsUp, Building2, UserCheck, DollarSign,
  Briefcase, Star, MessageSquare, PlusCircle, CheckCircle2,
  RefreshCw, TrendingUp, AlertCircle
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export default function ContinuousFeedbackLoop() {
  const [data, setData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    employer_name: 'Mahindra & Mahindra',
    sector_name: 'Automotive and Auto Components',
    district_name: 'Pune',
    job_role: 'EV Assembly Associate',
    interviews_held: 25,
    candidates_hired: 16,
    satisfaction_score: 4.5,
    avg_salary_inr: 26000,
    skills_hired: 'High Voltage Safety, Wire Harnessing, CAN Diagnostics',
    reported_skill_gaps: 'Need more practice with oscilloscope signal capture',
    employer_feedback: 'Strong foundational discipline. Eager to hire from next ITI batch.',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const loadData = () => {
    fetch(`${API_BASE}/api/outcomes/summary`)
      .then(r => r.json())
      .then(res => setData(res))
      .catch(e => console.error("Error loading feedback loop:", e));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/outcomes/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setSubmitSuccess(true);
        setTimeout(() => {
          setSubmitSuccess(false);
          setShowModal(false);
          loadData();
        }, 1200);
      }
    } catch (err) {
      console.error("Error submitting outcome:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="portal-container animate-fade-in">
      {/* Header */}
      <div className="portal-header feedback-gradient">
        <div className="portal-header-left">
          <div className="badge-pill bg-purple-glow">
            <RotateCcw size={16} /> Continuous Industry Feedback Loop
          </div>
          <h2>Closing the Loop: Post-Placement Intelligence into Curriculum</h2>
          <p>
            When employers hire trainees, real-world performance and skill gaps are fed back into
            institutes and policymakers to dynamically revise courses, equipment plans, and trainer modules.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <PlusCircle size={16} /> Ingest Employer Feedback
        </button>
      </div>

      {/* Stats Bar */}
      {data?.stats && (
        <div className="kpi-row-grid">
          <div className="card kpi-card">
            <div className="kpi-icon-wrap bg-purple-light">
              <Building2 size={20} className="text-purple" />
            </div>
            <div>
              <div className="kpi-value">{data.stats.total_employers_reporting}</div>
              <div className="kpi-label">Partner Employers</div>
            </div>
          </div>

          <div className="card kpi-card">
            <div className="kpi-icon-wrap bg-blue-light">
              <UserCheck size={20} className="text-blue" />
            </div>
            <div>
              <div className="kpi-value">{data.stats.total_candidates_hired} / {data.stats.total_candidates_interviewed}</div>
              <div className="kpi-label">Hired ({data.stats.interview_to_hire_ratio_pct}% Conversion)</div>
            </div>
          </div>

          <div className="card kpi-card">
            <div className="kpi-icon-wrap bg-amber-light">
              <Star size={20} className="text-amber" />
            </div>
            <div>
              <div className="kpi-value">{data.stats.avg_employer_satisfaction} / 5.0</div>
              <div className="kpi-label">Employer Satisfaction Index</div>
            </div>
          </div>

          <div className="card kpi-card">
            <div className="kpi-icon-wrap bg-green-light">
              <DollarSign size={20} className="text-green" />
            </div>
            <div>
              <div className="kpi-value">₹{data.stats.avg_starting_salary_inr.toLocaleString()}</div>
              <div className="kpi-label">Avg Starting Salary / Mo</div>
            </div>
          </div>

          <div className="card kpi-card">
            <div className="kpi-icon-wrap bg-red-light">
              <TrendingUp size={20} className="text-red" />
            </div>
            <div>
              <div className="kpi-value">{data.stats.avg_retention_rate_pct}%</div>
              <div className="kpi-label">6-Month Workplace Retention</div>
            </div>
          </div>
        </div>
      )}

      {/* Employer Outcome Records */}
      <div className="card animate-slide-up mt-4">
        <div className="card-header">
          <div>
            <h3>Real-World Employer Outcomes & Reported Skill Gaps</h3>
            <p className="subtext">
              Direct telemetry from Maharashtra industrial leaders powering curriculum updates.
            </p>
          </div>
        </div>

        <div className="outcomes-grid-stack">
          {data?.outcomes?.map((item, idx) => (
            <div key={idx} className="outcome-item-card">
              <div className="outcome-top-bar">
                <div className="employer-badge-info">
                  <strong>{item.employer}</strong>
                  <span className="badge badge-purple">{item.sector} • {item.district}</span>
                  <span className="role-lbl">Hired for: <em>{item.role}</em></span>
                </div>
                <div className="hire-metrics-badge">
                  <span className="hire-count"><strong>{item.hired}</strong> hired / {item.interviews} interviewed</span>
                  <span className="satisfaction-stars">⭐ {item.satisfaction}/5.0</span>
                  <span className="salary-pill">₹{item.salary.toLocaleString()}/mo</span>
                </div>
              </div>

              <div className="outcome-content-split">
                <div className="split-box">
                  <strong className="text-success"><CheckCircle2 size={14} /> Skills Successfully Hired:</strong>
                  <p className="skill-text">{item.skills_hired}</p>
                </div>
                <div className="split-box">
                  <strong className="text-danger"><AlertCircle size={14} /> Reported Skill Gaps:</strong>
                  <p className="gap-text">{item.reported_skill_gaps}</p>
                </div>
              </div>

              <div className="employer-verbatim">
                <MessageSquare size={14} className="text-purple" />
                <em>"{item.feedback}"</em>
                <span className="retention-tag">Retention: {item.retention}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal for Ingesting Employer Feedback */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card animate-scale-up">
            <div className="modal-header">
              <h3>Ingest Post-Placement Employer Feedback</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>
            {submitSuccess ? (
              <div className="success-banner">
                <CheckCircle2 size={32} color="#10b981" />
                <h4>Feedback Successfully Ingested!</h4>
                <p>Loop closed. Instituting updates across curriculum and training plans.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-group-row">
                  <div className="form-group">
                    <label>Employer / Company Name</label>
                    <input
                      type="text"
                      className="input-field"
                      value={formData.employer_name}
                      onChange={e => setFormData({ ...formData, employer_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>District</label>
                    <select
                      className="select-field"
                      value={formData.district_name}
                      onChange={e => setFormData({ ...formData, district_name: e.target.value })}
                    >
                      <option value="Pune">Pune</option>
                      <option value="Nashik">Nashik</option>
                      <option value="Nagpur">Nagpur</option>
                    </select>
                  </div>
                </div>

                <div className="form-group-row">
                  <div className="form-group">
                    <label>Sector</label>
                    <input
                      type="text"
                      className="input-field"
                      value={formData.sector_name}
                      onChange={e => setFormData({ ...formData, sector_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Job Role</label>
                    <input
                      type="text"
                      className="input-field"
                      value={formData.job_role}
                      onChange={e => setFormData({ ...formData, job_role: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group-row">
                  <div className="form-group">
                    <label>Interviews / Hires</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="number"
                        placeholder="Interviews"
                        className="input-field"
                        value={formData.interviews_held}
                        onChange={e => setFormData({ ...formData, interviews_held: Number(e.target.value) })}
                      />
                      <input
                        type="number"
                        placeholder="Hires"
                        className="input-field"
                        value={formData.candidates_hired}
                        onChange={e => setFormData({ ...formData, candidates_hired: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Satisfaction Score (1.0 - 5.0)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      className="input-field"
                      value={formData.satisfaction_score}
                      onChange={e => setFormData({ ...formData, satisfaction_score: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Skills Hired (Comma separated)</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.skills_hired}
                    onChange={e => setFormData({ ...formData, skills_hired: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Reported Skill Gaps Observed on Shopfloor</label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.reported_skill_gaps}
                    onChange={e => setFormData({ ...formData, reported_skill_gaps: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Employer Feedback / Recommendation for Institute</label>
                  <textarea
                    rows={2}
                    className="textarea-field"
                    value={formData.employer_feedback}
                    onChange={e => setFormData({ ...formData, employer_feedback: e.target.value })}
                  />
                </div>

                <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
                  {submitting ? 'Ingesting...' : 'Submit Employer Feedback to Update System'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
