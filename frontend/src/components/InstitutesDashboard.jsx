
import React, { useState, useEffect } from 'react';
import {
  School, BookOpen, Wrench, Users, BarChart3, AlertTriangle,
  CheckCircle, PlusCircle, ArrowUpRight, TrendingUp, RefreshCw,
  Sparkles, DollarSign, Cpu, FileText, ChevronRight
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export default function InstitutesDashboard({ selectedDistrict, setSelectedDistrict }) {
  const [districtId, setDistrictId] = useState(selectedDistrict === 'Nashik' ? 'D002' : selectedDistrict === 'Nagpur' ? 'D003' : 'D001');
  const [overview, setOverview] = useState(null);
  const [courseRecs, setCourseRecs] = useState(null);
  const [curriculumUpdates, setCurriculumUpdates] = useState(null);
  const [trainers, setTrainers] = useState([]);
  const [labGaps, setLabGaps] = useState(null);
  const [batches, setBatches] = useState([]);
  const [activeTab, setActiveTab] = useState('courses'); // 'courses' | 'curriculum' | 'trainers' | 'labs' | 'batches'
  const [loading, setLoading] = useState(false);

  // Sync with prop
  useEffect(() => {
    if (selectedDistrict === 'Nashik') setDistrictId('D002');
    else if (selectedDistrict === 'Nagpur') setDistrictId('D003');
    else setDistrictId('D001');
  }, [selectedDistrict]);

  const loadData = async (dId) => {
    setLoading(true);
    try {
      const [ovRes, crRes, cuRes, trRes, lgRes, bpRes] = await Promise.all([
        fetch(`${API_BASE}/api/institute/overview?district_id=${dId}`).then(r => r.json()),
        fetch(`${API_BASE}/api/institute/course-recommendations?district_id=${dId}`).then(r => r.json()),
        fetch(`${API_BASE}/api/institute/curriculum-updates?district_id=${dId}`).then(r => r.json()),
        fetch(`${API_BASE}/api/institute/trainers?district_id=${dId}`).then(r => r.json()),
        fetch(`${API_BASE}/api/institute/lab-gaps?district_id=${dId}`).then(r => r.json()),
        fetch(`${API_BASE}/api/institute/batch-performance?district_id=${dId}`).then(r => r.json()),
      ]);
      setOverview(ovRes);
      setCourseRecs(crRes);
      setCurriculumUpdates(cuRes);
      setTrainers(trRes);
      setLabGaps(lgRes);
      setBatches(bpRes);
    } catch (err) {
      console.error("Error loading institute data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(districtId);
  }, [districtId]);

  return (
    <div className="portal-container animate-fade-in">
      {/* Header */}
      <div className="portal-header institute-gradient">
        <div className="portal-header-left">
          <div className="badge-pill bg-blue-glow">
            <School size={16} /> Training Institutes Intelligence Hub
          </div>
          <h2>Transform Curricula & Lab Capacity with Evidence-Based Demand</h2>
          <p>
            Real-time alignment for Government ITIs, Polytechnics, and PMKK hubs across Maharashtra.
            Upgrade syllabus content, close trainer competency gaps, and invest in high-impact equipment.
          </p>
        </div>
        <div className="district-filter-control">
          <label>District Focus:</label>
          <select
            value={districtId}
            onChange={e => {
              setDistrictId(e.target.value);
              if (setSelectedDistrict) {
                if (e.target.value === 'D001') setSelectedDistrict('Pune');
                if (e.target.value === 'D002') setSelectedDistrict('Nashik');
                if (e.target.value === 'D003') setSelectedDistrict('Nagpur');
              }
            }}
            className="select-field"
          >
            <option value="D001">Pune (Industrial Hub)</option>
            <option value="D002">Nashik (Services & IT)</option>
            <option value="D003">Nagpur (Logistics & Power)</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      {overview && (
        <div className="kpi-row-grid">
          <div className="card kpi-card">
            <div className="kpi-icon-wrap bg-purple-light">
              <School size={20} className="text-purple" />
            </div>
            <div>
              <div className="kpi-value">{overview.total_institutes}</div>
              <div className="kpi-label">Affiliated Institutes</div>
            </div>
          </div>

          <div className="card kpi-card">
            <div className="kpi-icon-wrap bg-blue-light">
              <Users size={20} className="text-blue" />
            </div>
            <div>
              <div className="kpi-value">{overview.capacity_utilization_pct}%</div>
              <div className="kpi-label">Capacity Utilized ({overview.total_enrolled}/{overview.total_capacity})</div>
            </div>
          </div>

          <div className="card kpi-card">
            <div className="kpi-icon-wrap bg-green-light">
              <TrendingUp size={20} className="text-green" />
            </div>
            <div>
              <div className="kpi-value">{overview.avg_placement_rate}%</div>
              <div className="kpi-label">Avg Placement Rate</div>
            </div>
          </div>

          <div className="card kpi-card">
            <div className="kpi-icon-wrap bg-amber-light">
              <Wrench size={20} className="text-amber" />
            </div>
            <div>
              <div className="kpi-value">{overview.total_equipment_gaps} Critical</div>
              <div className="kpi-label">Lab Equipment Gaps</div>
            </div>
          </div>

          <div className="card kpi-card">
            <div className="kpi-icon-wrap bg-red-light">
              <AlertTriangle size={20} className="text-red" />
            </div>
            <div>
              <div className="kpi-value">{overview.trainers_requiring_upskill} Trainers</div>
              <div className="kpi-label">Upskilling Flagged</div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div className="institute-tabs-bar">
        <button
          className={`inst-tab-btn ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveTab('courses')}
        >
          <BookOpen size={16} /> Recommended Courses to Scale
        </button>
        <button
          className={`inst-tab-btn ${activeTab === 'curriculum' ? 'active' : ''}`}
          onClick={() => setActiveTab('curriculum')}
        >
          <Sparkles size={16} /> AI Curriculum Modernization
        </button>
        <button
          className={`inst-tab-btn ${activeTab === 'labs' ? 'active' : ''}`}
          onClick={() => setActiveTab('labs')}
        >
          <Wrench size={16} /> Lab & Equipment Shortage
        </button>
        <button
          className={`inst-tab-btn ${activeTab === 'trainers' ? 'active' : ''}`}
          onClick={() => setActiveTab('trainers')}
        >
          <Users size={16} /> Trainer Roster & Upskilling
        </button>
        <button
          className={`inst-tab-btn ${activeTab === 'batches' ? 'active' : ''}`}
          onClick={() => setActiveTab('batches')}
        >
          <BarChart3 size={16} /> Batch Performance
        </button>
      </div>

      {/* Tab 1: Course Recommendations */}
      {activeTab === 'courses' && courseRecs && (
        <div className="card animate-slide-up">
          <div className="card-header">
            <div>
              <h3>High-Demand Course Expansion Recommendations ({courseRecs.district_name})</h3>
              <p className="subtext">
                Ranked by demand-supply mismatch from MSSDS District Indicators. Scale intake here to maximize placement.
              </p>
            </div>
          </div>

          <div className="recommendations-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Target Sector</th>
                  <th>Recommended Program</th>
                  <th>Urgency</th>
                  <th>Industry Demand</th>
                  <th>Current MSSDS Supply</th>
                  <th>Recommended Expansion</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {courseRecs.recommended_new_courses.map((item, idx) => (
                  <tr key={idx}>
                    <td><strong>{item.sector_name}</strong></td>
                    <td>
                      <div className="program-title-box">
                        <strong>{item.recommended_course_title}</strong>
                        <span className="role-tags">{item.target_roles.join(', ')}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${item.urgency === 'Immediate' ? 'badge-danger' : 'badge-warning'}`}>
                        {item.urgency}
                      </span>
                    </td>
                    <td>{item.industry_demand.toLocaleString()} workers</td>
                    <td>{item.current_mssds_training.toLocaleString()} trained</td>
                    <td>
                      <strong className="text-purple">+{item.recommended_seat_expansion} seats</strong>
                    </td>
                    <td>
                      <button className="btn btn-outline btn-xs">
                        Prepare Intake Proposal <ArrowUpRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {courseRecs.curtailment_advisories && courseRecs.curtailment_advisories.length > 0 && (
            <div className="advisory-box mt-4">
              <h4>⚠️ Seat Rationalization Advisory (Oversupplied Sectors)</h4>
              <p className="subtext">
                Training supply significantly exceeds surveyed absorption. Consider converting seats to adjacent technical trades:
              </p>
              <div className="advisory-chips-grid">
                {courseRecs.curtailment_advisories.map((adv, i) => (
                  <div key={i} className="advisory-chip-card">
                    <strong>{adv.sector_name}</strong>
                    <span>Training: {adv.current_training} | Industry: {adv.industry_absorption}</span>
                    <p className="text-warning-muted">{adv.recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Curriculum Modernization */}
      {activeTab === 'curriculum' && curriculumUpdates && (
        <div className="card animate-slide-up">
          <div className="curriculum-ai-header">
            <div>
              <span className="badge badge-ai"><Sparkles size={14} /> Gemini 2.5 Flash Curriculum Audit</span>
              <h3>Modernization Advisory: Automotive & Advanced Manufacturing</h3>
              <p className="subtext">{curriculumUpdates.modernization_summary}</p>
            </div>
            <div className="alignment-badge-box">
              <span className="align-num">{curriculumUpdates.alignment_score_pct}%</span>
              <span className="align-lbl">Industry 4.0 Alignment</span>
            </div>
          </div>

          <div className="curriculum-split-grid">
            <div className="curriculum-col outdated-col">
              <h4>❌ Outdated Modules to Modernize / Retire</h4>
              <ul className="curriculum-list">
                {curriculumUpdates.outdated_topics.map((t, idx) => (
                  <li key={idx}>
                    <span className="bullet-cross">✕</span>
                    <div>
                      <strong>{t}</strong>
                      <p>Traditional manual procedures with decreasing shopfloor relevance</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="curriculum-col emerging-col">
              <h4>✅ High-Impact Emerging Topics to Add</h4>
              <div className="emerging-cards-stack">
                {curriculumUpdates.emerging_topics_to_add.map((t, idx) => (
                  <div key={idx} className="emerging-topic-card">
                    <div className="topic-header">
                      <strong>{t.topic}</strong>
                      <span className="badge badge-purple">{t.importance}</span>
                    </div>
                    <p className="topic-rationale">{t.industry_rationale}</p>
                    <span className="lab-req-tag">
                      {t.practical_lab_needed ? '🔬 Practical Lab Work Required' : '📖 Classroom / Theory'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="curriculum-footer-grid">
            <div className="footer-panel">
              <h4>👨‍🏫 Required Trainer Upgrades</h4>
              <ul>
                {curriculumUpdates.trainer_upskilling_modules.map((m, i) => (
                  <li key={i}>• {m}</li>
                ))}
              </ul>
            </div>
            <div className="footer-panel">
              <h4>🛠️ Recommended Lab Rigs</h4>
              <ul>
                {curriculumUpdates.lab_upgrades_recommended.map((m, i) => (
                  <li key={i}>• {m}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Lab Equipment Gaps */}
      {activeTab === 'labs' && labGaps && (
        <div className="card animate-slide-up">
          <div className="card-header">
            <div>
              <h3>Institute Lab & Machinery Gap Inventory</h3>
              <p className="subtext">
                Identified hardware deficiencies blocking high-wage job placements. Total funding requirement:
                <strong> ₹{(labGaps.total_estimated_investment_inr / 100000).toFixed(1)} Lakhs</strong>
              </p>
            </div>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Institute</th>
                <th>Sector</th>
                <th>Required Equipment</th>
                <th>Status</th>
                <th>Required Units</th>
                <th>Estimated Cost</th>
                <th>Impact Level</th>
              </tr>
            </thead>
            <tbody>
              {labGaps.items.map((eq, idx) => (
                <tr key={idx}>
                  <td><strong>{eq.institute}</strong></td>
                  <td>{eq.sector}</td>
                  <td><strong>{eq.equipment_name}</strong></td>
                  <td>
                    <span className={`badge ${eq.status === 'Missing' ? 'badge-danger' : 'badge-warning'}`}>
                      {eq.status}
                    </span>
                  </td>
                  <td>{eq.required_units} units</td>
                  <td><strong>₹{(eq.total_cost / 100000).toFixed(2)} L</strong></td>
                  <td>
                    <span className="badge badge-purple">{eq.impact}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Trainer Roster */}
      {activeTab === 'trainers' && (
        <div className="card animate-slide-up">
          <div className="card-header">
            <div>
              <h3>Trainer Competency & Upskilling Register</h3>
              <p className="subtext">
                Tracking faculty readiness against emerging curricula (EVs, Industry 4.0, Green skills).
              </p>
            </div>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Trainer Name</th>
                <th>Institute & District</th>
                <th>Sector Specialization</th>
                <th>Experience</th>
                <th>Upskilling Modules Assigned</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {trainers.map((tr, idx) => (
                <tr key={idx}>
                  <td><strong>{tr.name}</strong></td>
                  <td>{tr.institute} ({tr.district})</td>
                  <td>{tr.sector} - <em>{tr.specialization}</em></td>
                  <td>{tr.experience_years} years</td>
                  <td>
                    <span className="text-purple-dark">{tr.upskilling_needed || 'Fully certified'}</span>
                  </td>
                  <td>
                    <span className={`badge ${tr.status.includes('Recommended') ? 'badge-warning' : 'badge-success'}`}>
                      {tr.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 5: Batch Performance */}
      {activeTab === 'batches' && (
        <div className="card animate-slide-up">
          <div className="card-header">
            <div>
              <h3>Batch Outcomes & Placement Performance</h3>
              <p className="subtext">
                Monitored completion and placement metrics across training batches in Maharashtra.
              </p>
            </div>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Batch Code</th>
                <th>Institute</th>
                <th>Course Name</th>
                <th>Sector</th>
                <th>Enrolled / Certified</th>
                <th>Placed</th>
                <th>Pass %</th>
                <th>Placement %</th>
                <th>Avg Salary</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((b, idx) => (
                <tr key={idx}>
                  <td><code>{b.batch_code}</code></td>
                  <td><strong>{b.institute}</strong></td>
                  <td>{b.course}</td>
                  <td>{b.sector}</td>
                  <td>{b.enrolled} / {b.certified}</td>
                  <td><strong>{b.placed} candidates</strong></td>
                  <td>{b.pass_rate}%</td>
                  <td>
                    <strong className={b.placement_rate >= 80 ? 'text-success' : 'text-warning'}>
                      {b.placement_rate}%
                    </strong>
                  </td>
                  <td><strong>₹{b.avg_salary_pm.toLocaleString()}/mo</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
