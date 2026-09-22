
import { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowUpRight, BookOpen, BriefcaseBusiness, CheckCircle2, ChevronDown, CircleAlert, Database, GraduationCap, MapPin, RefreshCw, Search, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';

const API = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
const fmt = n => new Intl.NumberFormat('en-IN').format(n ?? 0);

function App() {
  const [filters, setFilters] = useState({ districts: [], sectors: [], data_mode: 'synthetic_demo' });
  const [district, setDistrict] = useState('Pune');
  const [sector, setSector] = useState('Automotive / EV');
  const [overview, setOverview] = useState(null);
  const [demand, setDemand] = useState([]);
  const [gaps, setGaps] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [courses, setCourses] = useState([]);
  const [tab, setTab] = useState('gaps');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true); setError('');
    try {
      const qs = new URLSearchParams({ district, sector });
      const [o,d,g,r,j,c] = await Promise.all([
        fetch(`${API}/api/overview?${qs}`).then(check),
        fetch(`${API}/api/demand?${qs}`).then(check),
        fetch(`${API}/api/gaps?${qs}`).then(check),
        fetch(`${API}/api/recommendations?${qs}`).then(check),
        fetch(`${API}/api/jobs?${qs}`).then(check),
        fetch(`${API}/api/courses?${qs}`).then(check),
      ]);
      setOverview(o); setDemand(d); setGaps(g); setRecommendations(r); setJobs(j); setCourses(c);
    } catch (e) { setError(e.message || 'Could not connect to API. Start the FastAPI server and refresh.'); }
    finally { setLoading(false); }
  }
  function check(r) { if (!r.ok) throw new Error(`API error ${r.status}`); return r.json(); }

  useEffect(() => {
    fetch(`${API}/api/filters`).then(check).then(f => {
      setFilters(f);
      if (f.districts?.length) setDistrict(current => f.districts.includes(current) ? current : f.districts[0]);
      if (f.sectors?.length) setSector(current => f.sectors.includes(current) ? current : f.sectors[0]);
    }).catch(e => setError(`Backend unavailable: ${e.message}`));
  }, []);
  useEffect(() => { if (district && sector) load(); }, [district, sector]);

  const maxDemand = useMemo(() => Math.max(1, ...demand.map(x => x.posting_count)), [demand]);
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark"><TrendingUp size={24}/></div>
        <div><strong>MahaSkill</strong><span>INTELLIGENCE</span></div>
      </div>
      <div className="side-label">WORKSPACE</div>
      <button className="nav-item active"><Activity size={17}/> Intelligence overview</button>
      <button className="nav-item" onClick={() => setTab('demand')}><Search size={17}/> Labour market explorer</button>
      <button className="nav-item" onClick={() => setTab('gaps')}><CircleAlert size={17}/> Skill gap analyzer</button>
      <button className="nav-item" onClick={() => setTab('recommendations')}><Sparkles size={17}/> Recommendations</button>
      <div className="sidebar-bottom">
        <div className="data-note"><ShieldCheck size={17}/><div><b>Demo environment</b><span>Synthetic records only</span></div></div>
        <div className="sidebar-foot">MAHARASHTRA · SKILLS & OPPORTUNITY</div>
      </div>
    </aside>
    <main className="main">
      <header className="topbar">
        <div className="crumb">Workspace <span>/</span> Intelligence Overview</div>
        <div className="top-right"><span className="status-dot"/> Prototype online <div className="avatar">GS</div></div>
      </header>
      <div className="content">
        <section className="page-heading">
          <div><div className="eyebrow">LABOUR MARKET INTELLIGENCE</div><h1>Skill Intelligence Overview</h1><p>Translate changing industry signals into evidence-led training actions.</p></div>
          <button className="refresh" onClick={load}><RefreshCw size={16}/> Refresh data</button>
        </section>
        <section className="filters">
          <div className="filter-title"><MapPin size={16}/> Explore by location & sector</div>
          <label>District<select value={district} onChange={e=>setDistrict(e.target.value)}>{filters.districts.map(x=><option key={x}>{x}</option>)}</select></label>
          <label>Sector<select value={sector} onChange={e=>setSector(e.target.value)}>{filters.sectors.map(x=><option key={x}>{x}</option>)}</select></label>
          <div className="demo-pill"><span/> DEMO DATA</div>
        </section>
        {error && <div className="error"><CircleAlert size={18}/><div><b>Connection issue</b><span>{error}</span></div></div>}
        {loading && <div className="loading"><RefreshCw className="spin"/> Loading intelligence…</div>}
        {!loading && overview && <>
          <div className="context-line"><span><MapPin size={14}/>{district}, Maharashtra</span><i>·</i><span>{sector}</span><i>·</i><span className="muted">Sample period: Aug 2026</span></div>
          <section className="metrics">
            <Metric icon={<BriefcaseBusiness/>} label="Sample job postings" value={fmt(overview.job_postings)} note="Synthetic job records" tone="purple"/>
            <Metric icon={<BookOpen/>} label="Training courses" value={fmt(overview.courses)} note="Selected district & sector" tone="blue"/>
            <Metric icon={<Activity/>} label="Skills detected" value={fmt(overview.skills_detected)} note="Curated dictionary matches" tone="green"/>
            <Metric icon={<CircleAlert/>} label="Potential skill gaps" value={fmt(overview.potential_gaps)} note="Rule-based flags · review needed" tone="orange"/>
          </section>
          <section className="main-grid">
            <div className="panel demand-panel">
              <div className="panel-head"><div><h2>Skills demand signals</h2><p>Skills mentioned in the selected synthetic job descriptions</p></div><button className="icon-btn" onClick={()=>setTab('demand')}><ArrowUpRight size={18}/></button></div>
              {demand.length ? <div className="bars">{demand.slice(0,7).map(item=><div className="bar-row" key={item.skill}><div className="bar-label"><span>{item.skill}</span><b>{item.posting_count}</b></div><div className="bar-track"><div className="bar-fill" style={{width:`${Math.max(5,item.posting_count/maxDemand*100)}%`}}/></div><div className="bar-meta">{item.posting_share_pct}% of sample postings</div></div>)}</div> : <Empty>No extracted skills for this filter.</Empty>}
              <div className="panel-foot"><span><span className="legend-dot"/> Mentions in demo postings</span><button onClick={()=>setTab('demand')}>Explore demand <ArrowUpRight size={14}/></button></div>
            </div>
            <div className="panel gap-panel">
              <div className="panel-head"><div><h2>Potential training gaps</h2><p>Demand signals compared with mapped course coverage</p></div><span className="small-tag">RULE-BASED</span></div>
              {gaps.length ? <div className="gap-list">{gaps.slice(0,5).map(g=><div className="gap-item" key={g.skill}><div className="gap-icon"><CircleAlert size={17}/></div><div className="gap-info"><b>{g.skill}</b><span>{g.gap_type === 'potential_course_gap' ? 'No mapped course coverage' : 'Partial mapped coverage'}</span></div><div className="gap-share">{g.posting_share_pct}%</div></div>)}</div> : <Empty>No potential gaps flagged for this selection.</Empty>}
              <div className="panel-foot"><span className="muted">Flags are not policy decisions.</span><button onClick={()=>setTab('gaps')}>View gap analysis <ArrowUpRight size={14}/></button></div>
            </div>
          </section>
          <section className="panel lower-panel">
            <div className="tab-head"><div><h2>Intelligence workspace</h2><p>Inspect source records, coverage, and recommended next steps.</p></div><div className="tabs"><button className={tab==='gaps'?'selected':''} onClick={()=>setTab('gaps')}>Gap analysis</button><button className={tab==='recommendations'?'selected':''} onClick={()=>setTab('recommendations')}>Recommendations</button><button className={tab==='demand'?'selected':''} onClick={()=>setTab('demand')}>Demand data</button><button className={tab==='jobs'?'selected':''} onClick={()=>setTab('jobs')}>Job records</button><button className={tab==='courses'?'selected':''} onClick={()=>setTab('courses')}>Courses</button></div></div>
            {tab==='gaps' && <DataTable headers={['Skill','Posting mentions','Share','Course coverage','Signal']} rows={gaps.map(g=>[g.skill,g.posting_count,`${g.posting_share_pct}%`,g.coverage,g.gap_type==='potential_course_gap'?'Potential course gap':'Potential module gap'])}/>}
            {tab==='demand' && <DataTable headers={['Skill','Category','Posting mentions','Share','Mapped coverage']} rows={demand.map(d=>[d.skill,d.category,d.posting_count,`${d.posting_share_pct}%`,d.coverage])}/>}
            {tab==='recommendations' && <div className="recommendation-list">{recommendations.length ? recommendations.map((r,i)=><div className="recommendation" key={r.skill}><div className="rec-number">0{i+1}</div><div className="rec-body"><b>{r.action}</b><p>{r.rationale}</p><span className="rec-status"><Sparkles size={13}/> Suggested · employer validation required</span></div></div>) : <Empty>No recommendations generated for this selection.</Empty>}</div>}
            {tab==='jobs' && <DataTable headers={['Role','District','Sector','Posted','Source']} rows={jobs.map(j=>[j.title,j.district,j.sector,j.posted_date,j.source])}/>}
            {tab==='courses' && <DataTable headers={['Course','District','Qualification','Seats','Trainers']} rows={courses.map(c=>[c.name,c.district,c.qualification,c.seats,c.trainers])}/>}
          </section>
          <footer className="disclaimer"><Database size={15}/><span><b>Data transparency:</b> This prototype uses synthetic demo records. Metrics are illustrative, not verified vacancies or official Maharashtra demand. Recommendations require employer and training-provider validation.</span></footer>
        </>}
      </div>
    </main>
  </div>;
}

function Metric({icon,label,value,note,tone}) { return <div className="metric-card"><div className={`metric-icon ${tone}`}>{icon}</div><div className="metric-label">{label}</div><div className="metric-value">{value}</div><div className="metric-note">{note}</div></div>; }
function DataTable({headers,rows}) { return <div className="table-wrap">{rows.length ? <table><thead><tr>{headers.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={i}>{r.map((v,j)=><td key={j}>{v}</td>)}</tr>)}</tbody></table> : <Empty>No records to display.</Empty>}</div>; }
function Empty({children}) { return <div className="empty">{children}</div>; }
export default App;
