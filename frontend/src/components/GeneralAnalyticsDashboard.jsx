
import { useEffect, useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Cell,
} from 'recharts';
import {
  Activity, BarChart3, BookOpen, Building2, CircleAlert, Database,
  GraduationCap, Layers, LayoutDashboard, MapPin, RefreshCw, Rocket,
  Search, ShieldCheck, Sparkles, Target, TrendingDown, TrendingUp, Users,
} from 'lucide-react';

const API = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
const fmt = n => new Intl.NumberFormat('en-IN').format(n ?? 0);

async function fetchJSON(path) {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json();
}

const COLORS = {
  purple: '#8c52ff', blue: '#3b82f6', green: '#10b981',
  amber: '#f59e0b', red: '#ef4444', indigo: '#6366f1',
};
const BAR_COLORS = ['#8c52ff', '#10b981', '#3b82f6', '#f59e0b'];

/* ── Main General Analytics Dashboard ───────────────────────── */

export default function GeneralAnalyticsDashboard() {
  const [view, setView] = useState('overview');
  const [districts, setDistricts] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState('D001');
  const [selectedSector, setSelectedSector] = useState('SEC_IT');
  const [stateData, setStateData] = useState(null);
  const [districtData, setDistrictData] = useState(null);
  const [mismatchData, setMismatchData] = useState(null);
  const [trainingPlan, setTrainingPlan] = useState(null);
  const [sectorData, setSectorData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Bootstrap
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchJSON('/api/districts'),
      fetchJSON('/api/sectors'),
      fetchJSON('/api/state-overview'),
    ]).then(([d, s, o]) => {
      setDistricts(d);
      setSectors(s);
      setStateData(o);
      setLoading(false);
    }).catch(e => {
      setError(`Backend unavailable: ${e.message}. Start the FastAPI server and refresh.`);
      setLoading(false);
    });
  }, []);

  // View-specific data loading
  useEffect(() => {
    if (view === 'district' && selectedDistrict) {
      fetchJSON(`/api/district-profile?district_id=${selectedDistrict}`)
        .then(setDistrictData).catch(e => setError(e.message));
    }
  }, [view, selectedDistrict]);

  useEffect(() => {
    if (view === 'gaps') {
      fetchJSON('/api/mismatch-analysis')
        .then(setMismatchData).catch(e => setError(e.message));
    }
  }, [view]);

  useEffect(() => {
    if (view === 'training' && selectedDistrict) {
      fetchJSON(`/api/training-plan?district_id=${selectedDistrict}`)
        .then(setTrainingPlan).catch(e => setError(e.message));
    }
  }, [view, selectedDistrict]);

  useEffect(() => {
    if (view === 'sector' && selectedSector) {
      fetchJSON(`/api/sector-intelligence?sector_id=${selectedSector}`)
        .then(setSectorData).catch(e => setError(e.message));
    }
  }, [view, selectedSector]);

  const protoDistricts = useMemo(
    () => districts.filter(d => d.is_prototype === 'Yes'),
    [districts],
  );

  const navItems = [
    { id: 'overview', icon: <LayoutDashboard size={17}/>, label: 'State Overview' },
    { id: 'district', icon: <MapPin size={17}/>, label: 'District Profile' },
    { id: 'gaps', icon: <CircleAlert size={17}/>, label: 'Gap Analysis' },
    { id: 'training', icon: <Target size={17}/>, label: 'Training Plan' },
    { id: 'sector', icon: <Layers size={17}/>, label: 'Sector Intelligence' },
  ];

  return (
    <div className="portal-container animate-fade-in">
      <div className="portal-header" style={{ background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95))', border: '1px solid var(--border)' }}>
        <div className="portal-header-left">
          <div className="badge-pill bg-purple-glow">
            <TrendingUp size={16} /> MSSDS Real Indicators Engine
          </div>
          <h2>General Labour Market & District Analytics Dashboard</h2>
          <p>
            Cross-district analytical engine powered by 2023 Maharashtra State Skill Development Society (MSSDS) gap studies.
            Explore 36 districts, 41 sectors, demand-supply mismatches, and prioritized training plans.
          </p>
        </div>
        <div className="portal-header-stat">
          <div className="stat-num">{districts.length || 36}</div>
          <div className="stat-lbl">Districts Profiled</div>
        </div>
      </div>

      {/* Sub-Nav Tabs */}
      <div className="result-nav-tabs" style={{ marginBottom: '1.5rem' }}>
        {navItems.map(n => (
          <button
            key={n.id}
            className={`tab-btn ${view === n.id ? 'active' : ''}`}
            onClick={() => setView(n.id)}
          >
            {n.icon} {n.label}
          </button>
        ))}
      </div>

      <div className="general-analytics-body">
        {error && (
          <div className="error">
            <CircleAlert size={18}/>
            <div><b>Connection issue</b><span>{error}</span></div>
          </div>
        )}
        {loading && <div className="loading"><RefreshCw className="spin" size={20}/> Loading intelligence data…</div>}

        {!loading && !error && view === 'overview' && stateData && (
          <StateOverview
            data={stateData}
            onSelectDistrict={id => { setSelectedDistrict(id); setView('district'); }}
          />
        )}
        {!loading && view === 'district' && (
          <DistrictProfile
            data={districtData}
            districts={protoDistricts}
            selectedDistrict={selectedDistrict}
            onSelect={setSelectedDistrict}
          />
        )}
        {!loading && view === 'gaps' && (
          <GapAnalysis data={mismatchData}/>
        )}
        {!loading && view === 'training' && (
          <TrainingPlanView
            data={trainingPlan}
            districts={protoDistricts}
            selectedDistrict={selectedDistrict}
            onSelect={setSelectedDistrict}
          />
        )}
        {!loading && view === 'sector' && (
          <SectorExplorer
            data={sectorData}
            sectors={sectors}
            selectedSector={selectedSector}
            onSelect={setSelectedSector}
          />
        )}
      </div>
    </div>
  );
}


/* ── State Overview ──────────────────────────────────────── */

function StateOverview({ data, onSelectDistrict }) {
  return <>
    <section className="page-heading">
      <div>
        <div className="eyebrow">LABOUR MARKET INTELLIGENCE</div>
        <h1>Maharashtra Skill Intelligence Overview</h1>
        <p>Translating real MSSDS district indicators into evidence-based training insights across {data.prototype_districts} prototype districts and {data.total_sectors} sectors.</p>
      </div>
    </section>

    <div className="metrics">
      <Metric icon={<MapPin/>} label="Districts Covered" value={data.total_districts} note={`${data.prototype_districts} prototype districts with full data`} tone="purple"/>
      <Metric icon={<Building2/>} label="Industry Employees" value={fmt(data.total_industry_employees)} note="Across surveyed organisations" tone="blue"/>
      <Metric icon={<GraduationCap/>} label="Candidates Trained" value={fmt(data.total_trainees)} note="Under MSSDS schemes (2022-23)" tone="green"/>
      <Metric icon={<Users/>} label="Candidate Aspirants" value={fmt(data.total_aspirants)} note="Aspiring to enter tracked sectors" tone="orange"/>
    </div>

    <div className="panel">
      <div className="panel-head">
        <div><h2>Prototype District Profiles</h2><p>Click a district to explore its full sector-level analysis</p></div>
        <span className="small-tag">MSSDS 2023</span>
      </div>
      <div className="district-grid">
        {data.district_summaries.map(d => (
          <div key={d.district_id} className="district-card" onClick={() => onSelectDistrict(d.district_id)}>
            <div className="district-card-head">
              <h3>{d.district_name}</h3>
              <span className="division-tag">{d.division} Division</span>
            </div>
            <div className="district-stats">
              <div>
                <div className="district-stat-label">Industry Size</div>
                <div className="district-stat-value">{fmt(d.total_industry)}</div>
              </div>
              <div>
                <div className="district-stat-label">Trainees</div>
                <div className="district-stat-value">{fmt(d.total_training)}</div>
              </div>
              <div>
                <div className="district-stat-label">Sectors Analyzed</div>
                <div className="district-stat-value">{d.sectors_analyzed}</div>
              </div>
              <div>
                <div className="district-stat-label">Undersupplied</div>
                <div className="district-stat-value" style={{color: d.undersupplied_sectors > 0 ? '#d97706' : '#10b981'}}>
                  {d.undersupplied_sectors}
                </div>
              </div>
            </div>
            <div className="district-gap-badges">
              {d.undersupplied_sectors > 0 &&
                <span className="gap-badge undersupply">{d.undersupplied_sectors} undersupplied</span>}
              {d.oversupplied_sectors > 0 &&
                <span className="gap-badge oversupply">{d.oversupplied_sectors} oversupplied</span>}
              {d.sectors_analyzed - d.undersupplied_sectors - d.oversupplied_sectors > 0 &&
                <span className="gap-badge balanced">{d.sectors_analyzed - d.undersupplied_sectors - d.oversupplied_sectors} balanced</span>}
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className="panel">
      <div className="panel-head">
        <div><h2>Sector Group Distribution</h2><p>MSSDS taxonomy classifies {data.total_sectors} sectors into groups</p></div>
      </div>
      {data.sector_groups && (
        <div className="district-stats" style={{gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))'}}>
          {Object.entries(data.sector_groups).sort((a,b) => b[1]-a[1]).map(([group, count]) => (
            <div key={group}>
              <div className="district-stat-label">{group}</div>
              <div className="district-stat-value">{count} sectors</div>
            </div>
          ))}
        </div>
      )}
    </div>

    <footer className="disclaimer">
      <Database size={15}/>
      <span>
        <b>Data source:</b> {data.source_title} ({data.source_year}).
        All indicators are from the official MSSDS District-wise Skill Gap Study Report.
        {' '}Analytics are computed from real survey data — validate recommendations with employers and training providers.
      </span>
    </footer>
  </>;
}


/* ── District Profile ────────────────────────────────────── */

function DistrictProfile({ data, districts, selectedDistrict, onSelect }) {
  const [tab, setTab] = useState('chart');

  return <>
    <section className="page-heading">
      <div>
        <div className="eyebrow">DISTRICT INTELLIGENCE</div>
        <h1>District Deep Dive</h1>
        <p>Sector-by-sector demand–supply analysis with mismatch scoring</p>
      </div>
    </section>

    <div className="filters-bar">
      <label>District
        <select value={selectedDistrict} onChange={e => onSelect(e.target.value)}>
          {districts.map(d => (
            <option key={d.district_id} value={d.district_id}>{d.district_name}</option>
          ))}
        </select>
      </label>
      {data && <span className="source-badge"><Database size={12}/> {data.division} Division · {data.summary?.sectors_analyzed} sectors</span>}
    </div>

    {!data ? <div className="loading"><RefreshCw className="spin" size={20}/> Loading district data…</div> : <>
      <div className="metrics">
        <Metric icon={<Building2/>} label="Industry Employees" value={fmt(data.summary.total_industry)} note={`Across ${data.summary.sectors_analyzed} sectors`} tone="blue"/>
        <Metric icon={<GraduationCap/>} label="Candidates Trained" value={fmt(data.summary.total_training)} note="MSSDS schemes (2022-23)" tone="green"/>
        <Metric icon={<TrendingDown/>} label="Undersupplied Sectors" value={data.summary.undersupplied} note="Need training scale-up" tone="orange"/>
        <Metric icon={<TrendingUp/>} label="Oversupplied Sectors" value={data.summary.oversupplied} note="Review/redirect recommended" tone="red"/>
      </div>

      <div className="tabs">
        <button className={tab === 'chart' ? 'selected' : ''} onClick={() => setTab('chart')}>Visual Analysis</button>
        <button className={tab === 'mismatch' ? 'selected' : ''} onClick={() => setTab('mismatch')}>Mismatch Bars</button>
        <button className={tab === 'table' ? 'selected' : ''} onClick={() => setTab('table')}>Data Table</button>
        <button className={tab === 'recs' ? 'selected' : ''} onClick={() => setTab('recs')}>Recommendations ({data.recommendations.length})</button>
      </div>

      {tab === 'chart' && <div className="panel">
        <div className="panel-head">
          <div><h2>Industry Size vs Training Supply</h2><p>Grouped comparison by sector for {data.district_name}</p></div>
        </div>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={Math.max(350, data.sectors.length * 36)}>
            <BarChart data={data.sectors.filter(s => s.industry_size > 0 || s.mssds_training > 0).slice(0, 20)} layout="vertical" margin={{left: 130, right: 30, top: 5, bottom: 5}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eae5f2"/>
              <XAxis type="number" tick={{fontSize: 10, fill: '#7c7490'}}/>
              <YAxis type="category" dataKey="sector_name" width={120} tick={{fontSize: 11, fill: '#453a5c'}}/>
              <Tooltip contentStyle={{borderRadius: 10, border: '1px solid #eae5f2', fontSize: 12}}
                formatter={(v, name) => [fmt(v), name]}/>
              <Legend wrapperStyle={{fontSize: 11}}/>
              <Bar dataKey="industry_size" fill="#8c52ff" name="Industry Size (Employees)" radius={[0, 4, 4, 0]}/>
              <Bar dataKey="mssds_training" fill="#10b981" name="MSSDS Training (Candidates)" radius={[0, 4, 4, 0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>}

      {tab === 'mismatch' && <div className="panel">
        <div className="panel-head">
          <div><h2>Demand–Supply Mismatch</h2><p>Positive = undersupply (need more training) · Negative = oversupply</p></div>
        </div>
        <MismatchBars entries={data.sectors}/>
      </div>}

      {tab === 'table' && <div className="panel">
        <div className="panel-head">
          <div><h2>Full Sector Analysis</h2><p>All indicators for {data.district_name}</p></div>
        </div>
        <SectorTable sectors={data.sectors}/>
      </div>}

      {tab === 'recs' && <div className="panel">
        <div className="panel-head">
          <div><h2>Actionable Recommendations</h2><p>Evidence-based next steps for {data.district_name}</p></div>
        </div>
        <RecList recs={data.recommendations}/>
      </div>}
    </>}
  </>;
}


/* ── Gap Analysis ────────────────────────────────────────── */

function GapAnalysis({ data }) {
  const [tab, setTab] = useState('undersupply');

  if (!data) return <div className="loading"><RefreshCw className="spin" size={20}/> Loading mismatch data…</div>;

  return <>
    <section className="page-heading">
      <div>
        <div className="eyebrow">MISMATCH INTELLIGENCE</div>
        <h1>Demand–Supply Gap Analysis</h1>
        <p>Cross-district mismatch scoring: where industry demand diverges from training supply</p>
      </div>
    </section>

    <div className="metrics">
      <Metric icon={<BarChart3/>} label="Total Sector-District Pairs" value={data.total_entries} note="Analyzed across all districts" tone="purple"/>
      <Metric icon={<TrendingDown/>} label="Undersupplied" value={data.undersupplied_count} note="Industry > Training capacity" tone="orange"/>
      <Metric icon={<TrendingUp/>} label="Oversupplied" value={data.oversupplied_count} note="Training > Industry absorption" tone="red"/>
      <Metric icon={<Activity/>} label="Balanced" value={data.balanced_count} note="Training ≈ Industry demand" tone="green"/>
    </div>

    <div className="tabs">
      <button className={tab === 'undersupply' ? 'selected' : ''} onClick={() => setTab('undersupply')}>
        Undersupplied ({data.undersupplied_count})
      </button>
      <button className={tab === 'oversupply' ? 'selected' : ''} onClick={() => setTab('oversupply')}>
        Oversupplied ({data.oversupplied_count})
      </button>
      <button className={tab === 'all' ? 'selected' : ''} onClick={() => setTab('all')}>
        All Entries ({data.total_entries})
      </button>
      <button className={tab === 'visual' ? 'selected' : ''} onClick={() => setTab('visual')}>
        Visual Map
      </button>
    </div>

    {tab === 'undersupply' && <div className="panel">
      <div className="panel-head">
        <div><h2>Undersupplied Sectors</h2><p>Industry demand exceeds training supply — candidates may find job opportunities but training is insufficient</p></div>
        <span className="small-tag">HIGH PRIORITY</span>
      </div>
      <MismatchTable entries={data.undersupplied}/>
    </div>}

    {tab === 'oversupply' && <div className="panel">
      <div className="panel-head">
        <div><h2>Oversupplied Sectors</h2><p>Training supply exceeds industry absorption — placement risk for candidates</p></div>
        <span className="small-tag">REVIEW</span>
      </div>
      <MismatchTable entries={data.oversupplied}/>
    </div>}

    {tab === 'all' && <div className="panel">
      <div className="panel-head">
        <div><h2>All Mismatch Entries</h2><p>Complete demand–supply analysis sorted by mismatch severity</p></div>
      </div>
      <MismatchTable entries={data.all_entries}/>
    </div>}

    {tab === 'visual' && <div className="panel">
      <div className="panel-head">
        <div><h2>Mismatch Divergence</h2><p>Bars extending right = undersupply · left = oversupply</p></div>
      </div>
      <MismatchBars entries={data.all_entries.filter(e => e.industry_size > 0 || e.mssds_training > 0).slice(0, 25)}
        showDistrict/>
    </div>}
  </>;
}


/* ── Training Plan ───────────────────────────────────────── */

function TrainingPlanView({ data, districts, selectedDistrict, onSelect }) {
  if (!data && !districts.length) return <div className="loading"><RefreshCw className="spin" size={20}/> Loading…</div>;

  return <>
    <section className="page-heading">
      <div>
        <div className="eyebrow">TRAINING INTELLIGENCE</div>
        <h1>District Training Plan</h1>
        <p>Evidence-based capacity recommendations: which sectors to scale up, review, or maintain</p>
      </div>
    </section>

    <div className="filters-bar">
      <label>District
        <select value={selectedDistrict} onChange={e => onSelect(e.target.value)}>
          {districts.map(d => (
            <option key={d.district_id} value={d.district_id}>{d.district_name}</option>
          ))}
        </select>
      </label>
      {data && <span className="source-badge"><Target size={12}/> {data.division} Division</span>}
    </div>

    {!data ? <div className="loading"><RefreshCw className="spin" size={20}/> Loading training plan…</div> : <>
      <div className="metrics">
        <Metric icon={<Rocket/>} label="Scale Up" value={data.scale_up.length} note="Sectors needing more training" tone="orange"/>
        <Metric icon={<Search/>} label="Review / Reduce" value={data.review_reduce.length} note="Potential oversupply" tone="red"/>
        <Metric icon={<Activity/>} label="Maintain" value={data.maintain.length} note="Reasonably balanced" tone="green"/>
        <Metric icon={<Sparkles/>} label="Recommendations" value={data.recommendations.length} note="Actionable next steps" tone="purple"/>
      </div>

      {data.scale_up.length > 0 && <div className="plan-section">
        <div className="plan-section-head">
          <Rocket size={16} color="#d97706"/>
          <h3>Scale Up Training</h3>
          <span className="plan-count up">{data.scale_up.length} sectors</span>
        </div>
        <div className="panel">
          <SectorTable sectors={data.scale_up}/>
        </div>
      </div>}

      {data.review_reduce.length > 0 && <div className="plan-section">
        <div className="plan-section-head">
          <TrendingDown size={16} color="#ef4444"/>
          <h3>Review / Reduce</h3>
          <span className="plan-count down">{data.review_reduce.length} sectors</span>
        </div>
        <div className="panel">
          <SectorTable sectors={data.review_reduce}/>
        </div>
      </div>}

      {data.maintain.length > 0 && <div className="plan-section">
        <div className="plan-section-head">
          <Activity size={16} color="#10b981"/>
          <h3>Maintain Current Levels</h3>
          <span className="plan-count ok">{data.maintain.length} sectors</span>
        </div>
        <div className="panel">
          <SectorTable sectors={data.maintain}/>
        </div>
      </div>}

      {data.recommendations.length > 0 && <div className="panel">
        <div className="panel-head">
          <div><h2>All Recommendations for {data.district_name}</h2><p>Priority-ranked actionable steps</p></div>
        </div>
        <RecList recs={data.recommendations}/>
      </div>}
    </>}
  </>;
}


/* ── Sector Explorer ─────────────────────────────────────── */

function SectorExplorer({ data, sectors, selectedSector, onSelect }) {
  return <>
    <section className="page-heading">
      <div>
        <div className="eyebrow">SECTOR INTELLIGENCE</div>
        <h1>Cross-District Sector View</h1>
        <p>Compare a single sector's performance across all prototype districts</p>
      </div>
    </section>

    <div className="filters-bar">
      <label>Sector
        <select value={selectedSector} onChange={e => onSelect(e.target.value)}>
          {sectors.map(s => (
            <option key={s.sector_id} value={s.sector_id}>{s.sector_name}</option>
          ))}
        </select>
      </label>
      {data && <span className="source-badge"><Layers size={12}/> {data.sector_group} Sector</span>}
    </div>

    {!data ? <div className="loading"><RefreshCw className="spin" size={20}/> Loading sector data…</div> : <>
      {data.districts.length === 0 ?
        <div className="empty">No indicator data available for this sector across prototype districts.</div> :
      <>
        <div className="panel">
          <div className="panel-head">
            <div><h2>{data.sector_name} — District Comparison</h2><p>All 4 indicators across districts with available data</p></div>
            <span className="small-tag">{data.sector_group.toUpperCase()}</span>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={Math.max(250, data.districts.length * 60)}>
              <BarChart data={data.districts} layout="vertical" margin={{left: 90, right: 30, top: 5, bottom: 5}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eae5f2"/>
                <XAxis type="number" tick={{fontSize: 10, fill: '#7c7490'}}/>
                <YAxis type="category" dataKey="district_name" width={80} tick={{fontSize: 11, fill: '#453a5c'}}/>
                <Tooltip contentStyle={{borderRadius: 10, border: '1px solid #eae5f2', fontSize: 12}}
                  formatter={(v, name) => [fmt(v), name]}/>
                <Legend wrapperStyle={{fontSize: 11}}/>
                <Bar dataKey="industry_size" fill="#8c52ff" name="Industry Size" radius={[0, 3, 3, 0]}/>
                <Bar dataKey="mssds_training" fill="#10b981" name="MSSDS Training" radius={[0, 3, 3, 0]}/>
                <Bar dataKey="candidate_aspiration" fill="#3b82f6" name="Aspiration" radius={[0, 3, 3, 0]}/>
                <Bar dataKey="dsdp_training" fill="#f59e0b" name="DSDP Target" radius={[0, 3, 3, 0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <div><h2>District-Level Detail</h2><p>Mismatch scores and gap classification for {data.sector_name}</p></div>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr>
                <th>District</th><th style={{textAlign:'right'}}>Industry</th><th style={{textAlign:'right'}}>Training</th>
                <th style={{textAlign:'right'}}>Aspiration</th><th style={{textAlign:'right'}}>DSDP</th>
                <th style={{textAlign:'right'}}>Mismatch</th><th>Classification</th>
              </tr></thead>
              <tbody>
                {data.districts.map(d => (
                  <tr key={d.district_id}>
                    <td style={{fontWeight: 600}}>{d.district_name}</td>
                    <td className="num">{fmt(d.industry_size)}</td>
                    <td className="num">{fmt(d.mssds_training)}</td>
                    <td className="num">{fmt(d.candidate_aspiration)}</td>
                    <td className="num">{fmt(d.dsdp_training)}</td>
                    <td className="num" style={{color: d.mismatch_score > 0 ? '#7c3aed' : '#d97706'}}>
                      {d.mismatch_score > 0 ? '+' : ''}{d.mismatch_score}%
                    </td>
                    <td><span className={`severity-tag ${d.gap_type}`}>{d.gap_label}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>}
    </>}
  </>;
}


/* ── Shared Components ───────────────────────────────────── */

function Metric({ icon, label, value, note, tone }) {
  return (
    <div className="metric-card">
      <div className={`metric-icon ${tone}`}>{icon}</div>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      <div className="metric-note">{note}</div>
    </div>
  );
}

function MismatchBars({ entries, showDistrict = false }) {
  const maxAbs = Math.max(1, ...entries.map(e => Math.abs(e.mismatch_score)));
  return (
    <div className="mismatch-list">
      {entries.map((e, i) => {
        const pct = Math.abs(e.mismatch_score) / maxAbs * 48;
        const isPositive = e.mismatch_score >= 0;
        return (
          <div className="mismatch-row" key={`${e.sector_id}-${e.district_id || i}`}>
            <div className="mismatch-label">
              {showDistrict ? `${e.district_name} · ${e.sector_name}` : e.sector_name}
            </div>
            <div className="mismatch-bar-container">
              <div className="mismatch-bar-center"/>
              <div className={`mismatch-bar-fill ${isPositive ? 'positive' : 'negative'}`}
                style={isPositive
                  ? { left: '50%', width: `${pct}%` }
                  : { right: '50%', width: `${pct}%`, left: `${50 - pct}%` }
                }/>
            </div>
            <div className={`mismatch-score ${isPositive ? 'positive' : 'negative'}`}>
              {isPositive ? '+' : ''}{e.mismatch_score}%
            </div>
            <div className="mismatch-type">
              <span className={`severity-tag ${e.gap_type}`}>{e.gap_label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SectorTable({ sectors }) {
  if (!sectors?.length) return <div className="empty">No sector data available.</div>;
  return (
    <div className="table-wrap">
      <table>
        <thead><tr>
          <th>Sector</th>
          <th style={{textAlign:'right'}}>Industry Size</th>
          <th style={{textAlign:'right'}}>MSSDS Training</th>
          <th style={{textAlign:'right'}}>Aspiration</th>
          <th style={{textAlign:'right'}}>DSDP Target</th>
          <th style={{textAlign:'right'}}>Mismatch</th>
          <th style={{textAlign:'right'}}>Aspiration Gap</th>
          <th>Status</th>
        </tr></thead>
        <tbody>
          {sectors.map(s => (
            <tr key={s.sector_id}>
              <td style={{fontWeight: 600}}>{s.sector_name}</td>
              <td className="num">{fmt(s.industry_size)}</td>
              <td className="num">{fmt(s.mssds_training)}</td>
              <td className="num">{fmt(s.candidate_aspiration)}</td>
              <td className="num">{fmt(s.dsdp_training)}</td>
              <td className="num" style={{color: s.mismatch_score > 0 ? '#7c3aed' : '#d97706'}}>
                {s.mismatch_score > 0 ? '+' : ''}{s.mismatch_score}%
              </td>
              <td className="num" style={{color: s.aspiration_gap > 0 ? '#3b82f6' : '#10b981'}}>
                {s.aspiration_gap > 0 ? '+' : ''}{s.aspiration_gap}%
              </td>
              <td><span className={`severity-tag ${s.gap_type}`}>{s.gap_label}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MismatchTable({ entries }) {
  if (!entries?.length) return <div className="empty">No entries to display.</div>;
  return (
    <div className="table-wrap">
      <table>
        <thead><tr>
          <th>District</th><th>Sector</th>
          <th style={{textAlign:'right'}}>Industry</th><th style={{textAlign:'right'}}>Training</th>
          <th style={{textAlign:'right'}}>Deficit / Surplus</th>
          <th style={{textAlign:'right'}}>Mismatch</th><th>Status</th>
        </tr></thead>
        <tbody>
          {entries.map((e, i) => {
            const diff = e.industry_size - e.mssds_training;
            return (
              <tr key={`${e.sector_id}-${e.district_id}-${i}`}>
                <td style={{fontWeight: 600}}>{e.district_name}</td>
                <td>{e.sector_name}</td>
                <td className="num">{fmt(e.industry_size)}</td>
                <td className="num">{fmt(e.mssds_training)}</td>
                <td className="num" style={{color: diff > 0 ? '#7c3aed' : '#d97706'}}>
                  {diff > 0 ? '+' : ''}{fmt(diff)}
                </td>
                <td className="num" style={{color: e.mismatch_score > 0 ? '#7c3aed' : '#d97706'}}>
                  {e.mismatch_score > 0 ? '+' : ''}{e.mismatch_score}%
                </td>
                <td><span className={`severity-tag ${e.gap_type}`}>{e.gap_label}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RecList({ recs }) {
  if (!recs?.length) return <div className="empty">No recommendations generated.</div>;
  return (
    <div className="rec-list">
      {recs.map((r, i) => (
        <div className="rec-card" key={i}>
          <div className={`rec-priority ${r.priority}`}>
            {r.priority === 'high' ? '!!' : r.priority === 'medium' ? '!' : '·'}
          </div>
          <div className="rec-body">
            <b>{r.action}</b>
            <p>{r.rationale}</p>
            <div className="rec-meta">
              <span>{r.type?.replace(/_/g, ' ').toUpperCase()}</span>
              <span>{r.priority.toUpperCase()} PRIORITY</span>
              {r.sector && <span>{r.sector}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
