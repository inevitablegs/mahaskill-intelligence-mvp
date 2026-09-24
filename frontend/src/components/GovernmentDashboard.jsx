
import React, { useState, useEffect } from 'react';
import {
  Landmark, TrendingUp, AlertOctagon, CheckCircle2, Sliders,
  Sparkles, DollarSign, BarChart2, PieChart, ShieldAlert,
  ArrowRight, RefreshCw, FileText, ChevronDown
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export default function GovernmentDashboard({ selectedDistrict, setSelectedDistrict }) {
  const [kpis, setKpis] = useState(null);
  const [districtId, setDistrictId] = useState(selectedDistrict === 'Nashik' ? 'D002' : selectedDistrict === 'Nagpur' ? 'D003' : 'D001');
  const [policyBrief, setPolicyBrief] = useState(null);
  const [mismatchData, setMismatchData] = useState(null);
  const [activeTab, setActiveTab] = useState('trends'); // 'trends' | 'matrix' | 'policy' | 'simulator'
  
  // What-If Simulator State
  const [simReallocations, setSimReallocations] = useState({
    'Automotive and Auto Components': 80,
    'Capital Goods': 60,
    'Electronics and Hardware': 50,
  });
  const [simBudgetLakhs, setSimBudgetLakhs] = useState(45);
  const [simResult, setSimResult] = useState(null);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/government/kpis`)
      .then(r => r.json())
      .then(data => setKpis(data))
      .catch(e => console.error("Error loading government KPIs:", e));

    fetch(`${API_BASE}/api/mismatch-analysis`)
      .then(r => r.json())
      .then(data => setMismatchData(data))
      .catch(e => console.error("Error loading mismatch data:", e));
  }, []);

  const loadPolicyBrief = (dId) => {
    fetch(`${API_BASE}/api/government/policy-brief?district_id=${dId}`)
      .then(r => r.json())
      .then(data => setPolicyBrief(data))
      .catch(e => console.error("Error loading policy brief:", e));
  };

  useEffect(() => {
    loadPolicyBrief(districtId);
  }, [districtId]);

  const runSimulation = async () => {
    setSimulating(true);
    try {
      const res = await fetch(`${API_BASE}/api/government/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          district_id: districtId,
          seat_reallocations: simReallocations,
          additional_funding_lakhs: simBudgetLakhs,
        }),
      });
      const data = await res.json();
      setSimResult(data);
    } catch (err) {
      console.error("Simulation error:", err);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="portal-container animate-fade-in">
      {/* Header */}
      <div className="portal-header government-gradient">
        <div className="portal-header-left">
          <div className="badge-pill bg-purple-glow">
            <Landmark size={16} /> Maharashtra State Skill Planning & Policy Command
          </div>
          <h2>Evidence-Based Workforce Planning Across 36 Districts</h2>
          <p>
            Macro-level triangulation of Maharashtra State Skill Development Society (MSSDS) data,
            industry employment registers, and district skill development plans (DSDP).
          </p>
        </div>
        <div className="district-filter-control">
          <label>Policy District:</label>
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
            <option value="D001">Pune</option>
            <option value="D002">Nashik</option>
            <option value="D003">Nagpur</option>
          </select>
        </div>
      </div>

      {/* State-Level KPI Summary */}
      {kpis && (
        <div className="kpi-row-grid">
          <div className="card kpi-card">
            <div className="kpi-icon-wrap bg-purple-light">
              <Landmark size={20} className="text-purple" />
            </div>
            <div>
              <div className="kpi-value">{kpis.total_districts_tracked} Districts</div>
              <div className="kpi-label">Geographic Coverage (All MH)</div>
            </div>
          </div>

          <div className="card kpi-card">
            <div className="kpi-icon-wrap bg-blue-light">
              <TrendingUp size={20} className="text-blue" />
            </div>
            <div>
              <div className="kpi-value">{kpis.state_total_industry_demand.toLocaleString()}</div>
              <div className="kpi-label">Surveyed Industry Workforce</div>
            </div>
          </div>

          <div className="card kpi-card">
            <div className="kpi-icon-wrap bg-green-light">
              <CheckCircle2 size={20} className="text-green" />
            </div>
            <div>
              <div className="kpi-value">{kpis.state_total_training_supply.toLocaleString()}</div>
              <div className="kpi-label">MSSDS Trainees Supplied</div>
            </div>
          </div>

          <div className="card kpi-card">
            <div className="kpi-icon-wrap bg-amber-light">
              <BarChart2 size={20} className="text-amber" />
            </div>
            <div>
              <div className="kpi-value">{kpis.state_alignment_index_pct}%</div>
              <div className="kpi-label">Demand-Supply Alignment Index</div>
            </div>
          </div>

          <div className="card kpi-card">
            <div className="kpi-icon-wrap bg-red-light">
              <ShieldAlert size={20} className="text-red" />
            </div>
            <div>
              <div className="kpi-value">{kpis.critical_undersupply_clusters} Sectors</div>
              <div className="kpi-label">Critical Shortage Pockets</div>
            </div>
          </div>
        </div>
      )}

      {/* Sub Navigation */}
      <div className="institute-tabs-bar">
        <button
          className={`inst-tab-btn ${activeTab === 'trends' ? 'active' : ''}`}
          onClick={() => setActiveTab('trends')}
        >
          <TrendingUp size={16} /> District Demand Trends
        </button>
        <button
          className={`inst-tab-btn ${activeTab === 'matrix' ? 'active' : ''}`}
          onClick={() => setActiveTab('matrix')}
        >
          <BarChart2 size={16} /> Statewide Mismatch Matrix
        </button>
        <button
          className={`inst-tab-btn ${activeTab === 'policy' ? 'active' : ''}`}
          onClick={() => setActiveTab('policy')}
        >
          <Sparkles size={16} /> AI Policy Advisor Brief
        </button>
        <button
          className={`inst-tab-btn ${activeTab === 'simulator' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('simulator');
            if (!simResult) runSimulation();
          }}
        >
          <Sliders size={16} /> What-If Policy Simulator
        </button>
      </div>

      {/* Tab 1: District Demand Trends */}
      {activeTab === 'trends' && kpis && (
        <div className="card animate-slide-up">
          <div className="card-header">
            <div>
              <h3>Maharashtra Prototype Districts Demand vs Supply Comparison</h3>
              <p className="subtext">
                Aggregated industry demand (blue) vs MSSDS skill-training output (purple) across key prototype districts.
              </p>
            </div>
          </div>

          <div className="chart-container" style={{ height: 340 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={kpis.district_summaries} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8e4f5" />
                <XAxis dataKey="district_name" tick={{ fill: '#4a3f68', fontWeight: 600 }} />
                <YAxis tick={{ fill: '#7d6ea3' }} />
                <Tooltip
                  formatter={(val) => Number(val).toLocaleString()}
                  contentStyle={{ background: '#fff', borderRadius: 10, border: '1px solid #d4c8ef' }}
                />
                <Legend />
                <Bar dataKey="total_industry" name="Industry Demand (Employees)" fill="#5b3cb8" radius={[6, 6, 0, 0]} />
                <Bar dataKey="total_training" name="MSSDS Supply (Trainees)" fill="#10b981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="total_aspiration" name="Candidate Aspiration" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 2: Statewide Mismatch Matrix */}
      {activeTab === 'matrix' && mismatchData && (
        <div className="card animate-slide-up">
          <div className="card-header">
            <div>
              <h3>Statewide Labour Market Mismatch Register</h3>
              <p className="subtext">
                76 district-sector pairs classified by severity. Positive mismatch % indicates severe undercapacity.
              </p>
            </div>
            <div className="badge-row">
              <span className="badge badge-danger">{mismatchData.undersupplied_count} Undersupplied</span>
              <span className="badge badge-warning">{mismatchData.oversupplied_count} Oversupplied</span>
              <span className="badge badge-success">{mismatchData.balanced_count} Balanced</span>
            </div>
          </div>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>District</th>
                  <th>Sector</th>
                  <th>Industry Demand</th>
                  <th>MSSDS Supply</th>
                  <th>Mismatch %</th>
                  <th>Severity Bucket</th>
                  <th>Candidate Aspiration</th>
                </tr>
              </thead>
              <tbody>
                {mismatchData.all_entries.slice(0, 15).map((row, idx) => (
                  <tr key={idx}>
                    <td><strong>{row.district_name}</strong></td>
                    <td>{row.sector_name}</td>
                    <td>{row.industry_size?.toLocaleString()}</td>
                    <td>{row.mssds_training?.toLocaleString()}</td>
                    <td>
                      <strong className={row.mismatch_score > 50 ? 'text-red' : row.mismatch_score < -20 ? 'text-amber' : 'text-green'}>
                        {row.mismatch_score > 0 ? `+${row.mismatch_score}%` : `${row.mismatch_score}%`}
                      </strong>
                    </td>
                    <td>
                      <span className={`badge ${
                        row.gap_type.includes('critical') ? 'badge-danger' :
                        row.gap_type.includes('undersupply') ? 'badge-warning' :
                        row.gap_type.includes('oversupply') ? 'badge-purple' : 'badge-success'
                      }`}>
                        {row.gap_label}
                      </span>
                    </td>
                    <td>{row.candidate_aspiration?.toLocaleString()} youth</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: AI Policy Advisor Brief */}
      {activeTab === 'policy' && policyBrief && (
        <div className="card animate-slide-up">
          <div className="policy-brief-header">
            <div>
              <span className="badge badge-ai"><Sparkles size={14} /> Gemini 2.5 Flash Automated Policy Memo</span>
              <h3>Executive Policy Advisory for {districtId === 'D001' ? 'Pune' : districtId === 'D002' ? 'Nashik' : 'Nagpur'}</h3>
              <p className="policy-exec-summary">{policyBrief.executive_summary}</p>
            </div>
          </div>

          <div className="policy-grid-sections">
            <div className="policy-col">
              <h4>📋 Key Macro Findings</h4>
              <ul className="policy-findings-list">
                {policyBrief.key_findings.map((f, i) => (
                  <li key={i}>• {f}</li>
                ))}
              </ul>

              <h4 className="mt-4">🎯 Target State KPIs</h4>
              <div className="policy-kpi-stack">
                {policyBrief.kpis.map((k, i) => (
                  <div key={i} className="policy-kpi-chip">
                    <strong>{k.metric}</strong>
                    <span>Current: {k.current_value} → <strong>Target: {k.target_value}</strong> ({k.timeline})</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="policy-col">
              <h4>💰 Priority Funding Allocations (CapEx / Subsidy)</h4>
              <div className="funding-priorities-list">
                {policyBrief.funding_priorities.map((fp, i) => (
                  <div key={i} className="funding-card">
                    <div className="funding-card-top">
                      <strong>{fp.sector}</strong>
                      <span className={`badge ${fp.amount_category === 'high' ? 'badge-danger' : 'badge-purple'}`}>
                        {fp.amount_category.toUpperCase()} PRIORITY
                      </span>
                    </div>
                    <p className="funding-justification">{fp.justification}</p>
                  </div>
                ))}
              </div>

              <h4 className="mt-4">⚠️ Strategic Risk Factors</h4>
              <ul className="policy-risks-list">
                {policyBrief.risk_factors.map((r, i) => (
                  <li key={i}>⚠️ {r}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: What-If Policy Simulator */}
      {activeTab === 'simulator' && (
        <div className="card animate-slide-up">
          <div className="card-header">
            <div>
              <span className="badge badge-purple"><Sliders size={14} /> Interactive Scenario Engine</span>
              <h3>What-If Policy & Capacity Reallocation Simulator</h3>
              <p className="subtext">
                Simulate shifting training seats into critical undersupplied sectors and allocating incremental budget
                to project gap closure and placement yield.
              </p>
            </div>
            <button className="btn btn-primary" onClick={runSimulation} disabled={simulating}>
              {simulating ? <><RefreshCw size={16} className="spin" /> Calculating...</> : <><Sparkles size={16} /> Recalculate Scenario</>}
            </button>
          </div>

          <div className="simulator-controls-grid">
            <div className="control-box">
              <label>Automotive & EV Training Seat Shift (+seats): <strong>+{simReallocations['Automotive and Auto Components']}</strong></label>
              <input
                type="range"
                min="0"
                max="250"
                step="10"
                value={simReallocations['Automotive and Auto Components']}
                onChange={e => setSimReallocations({ ...simReallocations, 'Automotive and Auto Components': Number(e.target.value) })}
                className="slider-input"
              />
            </div>

            <div className="control-box">
              <label>Capital Goods & CNC Intake Shift (+seats): <strong>+{simReallocations['Capital Goods']}</strong></label>
              <input
                type="range"
                min="0"
                max="200"
                step="10"
                value={simReallocations['Capital Goods']}
                onChange={e => setSimReallocations({ ...simReallocations, 'Capital Goods': Number(e.target.value) })}
                className="slider-input"
              />
            </div>

            <div className="control-box">
              <label>Electronics & PLC Intake Shift (+seats): <strong>+{simReallocations['Electronics and Hardware']}</strong></label>
              <input
                type="range"
                min="0"
                max="150"
                step="10"
                value={simReallocations['Electronics and Hardware']}
                onChange={e => setSimReallocations({ ...simReallocations, 'Electronics and Hardware': Number(e.target.value) })}
                className="slider-input"
              />
            </div>

            <div className="control-box">
              <label>Additional CapEx / Lab Budget: <strong>₹{simBudgetLakhs} Lakhs</strong></label>
              <input
                type="range"
                min="0"
                max="150"
                step="5"
                value={simBudgetLakhs}
                onChange={e => setSimBudgetLakhs(Number(e.target.value))}
                className="slider-input"
              />
            </div>
          </div>

          {/* Simulation Output Projections */}
          {simResult && (
            <div className="simulation-results-box mt-4">
              <div className="sim-stats-banner">
                <div className="sim-stat-item">
                  <span className="sim-stat-num text-green">-{simResult.gap_reduction_count}</span>
                  <span className="sim-stat-lbl">Critical Gap Sectors Reduced</span>
                </div>
                <div className="sim-stat-item">
                  <span className="sim-stat-num text-purple">+{simResult.projected_additional_placements}</span>
                  <span className="sim-stat-lbl">Projected Annual Placements Gained</span>
                </div>
                <div className="sim-stat-item">
                  <span className="sim-stat-num text-blue">₹{simResult.additional_funding_lakhs} L</span>
                  <span className="sim-stat-lbl">Total Public Investment</span>
                </div>
              </div>

              <h4 className="mt-4">Simulated Sector Trajectory</h4>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Sector</th>
                    <th>Baseline Training</th>
                    <th>Simulated Training</th>
                    <th>Baseline Mismatch</th>
                    <th>Simulated Mismatch</th>
                    <th>Net Improvement</th>
                    <th>Projected Status</th>
                  </tr>
                </thead>
                <tbody>
                  {simResult.simulated_sectors
                    .filter(s => s.delta_seats > 0)
                    .map((s, idx) => (
                      <tr key={idx}>
                        <td><strong>{s.sector_name}</strong></td>
                        <td>{s.baseline_training}</td>
                        <td><strong className="text-purple">{s.simulated_training}</strong> (+{s.delta_seats})</td>
                        <td>{s.baseline_mismatch}%</td>
                        <td><strong>{s.simulated_mismatch}%</strong></td>
                        <td><span className="badge badge-success">+{s.gap_improvement}%</span></td>
                        <td>
                          <span className={`badge ${s.new_gap_type.includes('critical') ? 'badge-danger' : 'badge-warning'}`}>
                            {s.new_severity_label}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
