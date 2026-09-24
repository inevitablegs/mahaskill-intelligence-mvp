
import React, { useState, useEffect } from 'react';
import {
  GraduationCap, School, Landmark, RotateCcw, Sparkles,
  LayoutDashboard, MapPin, CircleAlert, Workflow, ChevronRight,
  ShieldCheck, Cpu, Database, BarChart3, Menu, X
} from 'lucide-react';

import CandidatePortal from './components/CandidatePortal';
import InstitutesDashboard from './components/InstitutesDashboard';
import GovernmentDashboard from './components/GovernmentDashboard';
import GeneralAnalyticsDashboard from './components/GeneralAnalyticsDashboard';
import ContinuousFeedbackLoop from './components/ContinuousFeedbackLoop';
import AIExtractionPlayground from './components/AIExtractionPlayground';
import ArchitectureModal from './components/ArchitectureModal';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export default function App() {
  const [activeView, setActiveView] = useState('candidate'); // 'candidate' | 'institute' | 'government' | 'analytics' | 'feedback' | 'ai_playground'
  const [selectedDistrict, setSelectedDistrict] = useState('Pune');
  const [showArchModal, setShowArchModal] = useState(false);
  const [geminiActive, setGeminiActive] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/health`)
      .then(res => res.json())
      .then(data => {
        if (data.gemini_active) setGeminiActive(true);
      })
      .catch(err => console.error("Health check error:", err));
  }, []);

  const stakeholderNav = [
    {
      id: 'candidate',
      label: 'Candidates Portal',
      icon: <GraduationCap size={18} />,
      badge: 'Individual',
      desc: 'Assessments, Pathways, Gaps & Jobs',
    },
    {
      id: 'institute',
      label: 'Institutes Dashboard',
      icon: <School size={18} />,
      badge: 'Institutional',
      desc: 'Curricula, Labs, Trainers & Batches',
    },
    {
      id: 'government',
      label: 'Government Dashboard',
      icon: <Landmark size={18} />,
      badge: 'Policy & State',
      desc: '36-District Trends & What-If Sim',
    },
  ];

  const intelligenceNav = [
    {
      id: 'analytics',
      label: 'General Data Analytics',
      icon: <BarChart3 size={18} />,
      badge: 'MSSDS Real',
      desc: 'Macro Overview, Profiles & Gap Tables',
    },
    {
      id: 'feedback',
      label: 'Continuous Update Loop',
      icon: <RotateCcw size={18} />,
      badge: 'Employer Feedback',
      desc: 'Employer Outcomes & Real Telemetry',
    },
    {
      id: 'ai_playground',
      label: 'Gemini AI / NLP Playground',
      icon: <Sparkles size={18} />,
      badge: 'LLM & NLP',
      desc: 'Live Skill Extraction & Mapping',
    },
  ];

  const allNav = [...stakeholderNav, ...intelligenceNav];

  return (
    <div className="app-shell">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="sidebar-backdrop" 
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar (Desktop sticky & Mobile off-canvas drawer) */}
      <aside className={`sidebar ${mobileMenuOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header-row">
          <div className="brand" onClick={() => { setShowArchModal(true); setMobileMenuOpen(false); }} style={{ cursor: 'pointer' }}>
            <div className="brand-mark">
              <img src="/brand-icon.png" alt="MahaSkill Logo" className="brand-logo-img" />
            </div>
            <div>
              <strong>MahaSkill</strong>
              <span>INTELLIGENCE</span>
            </div>
          </div>
          <button 
            className="sidebar-close-btn" 
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="side-label">3 STAKEHOLDER DASHBOARDS</div>
        {stakeholderNav.map(item => (
          <button
            key={item.id}
            className={`nav-item ${activeView === item.id ? 'active' : ''}`}
            onClick={() => {
              setActiveView(item.id);
              setMobileMenuOpen(false);
            }}
          >
            <span className="nav-icon-wrap">{item.icon}</span>
            <div className="nav-text-col">
              <div className="nav-title-row">
                <span>{item.label}</span>
                <span className="badge badge-mini">{item.badge}</span>
              </div>
              <small className="nav-sub">{item.desc}</small>
            </div>
          </button>
        ))}

        <div className="side-label mt-4">DATA ANALYTICS & AI ENGINE</div>
        {intelligenceNav.map(item => (
          <button
            key={item.id}
            className={`nav-item ${activeView === item.id ? 'active' : ''}`}
            onClick={() => {
              setActiveView(item.id);
              setMobileMenuOpen(false);
            }}
          >
            <span className="nav-icon-wrap">{item.icon}</span>
            <div className="nav-text-col">
              <div className="nav-title-row">
                <span>{item.label}</span>
                <span className="badge badge-mini">{item.badge}</span>
              </div>
              <small className="nav-sub">{item.desc}</small>
            </div>
          </button>
        ))}

        <div className="sidebar-bottom">
          <button className="arch-blueprint-btn" onClick={() => { setShowArchModal(true); setMobileMenuOpen(false); }}>
            <Workflow size={16} /> Technical Flow Blueprint
          </button>

          <div className="ai-status-pill">
            <span className={`status-dot ${geminiActive ? 'dot-active' : 'dot-fallback'}`}></span>
            <div>
              <strong>Gemini 2.5 Flash</strong>
              <span>{geminiActive ? 'LLM & NLP Connected' : 'Rule-Based Fallback Mode'}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <main className="main-content">
        {/* Top Navbar */}
        <header className="topbar">
          <div className="topbar-left">
            <button 
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation drawer"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            <div className="topbar-brand-mobile" onClick={() => setShowArchModal(true)}>
              <img src="/brand-icon.png" alt="MahaSkill" className="brand-logo-img-mobile" />
              <strong>MahaSkill <span>Intelligence</span></strong>
            </div>

            <span className="topbar-breadcrumb">
              Maharashtra Skill Ecosystem ➔ <strong>{allNav.find(n => n.id === activeView)?.label}</strong>
            </span>
          </div>

          <div className="topbar-right">
            <button className="btn btn-outline btn-sm topbar-bp-btn" onClick={() => setShowArchModal(true)}>
              <Workflow size={14} /> <span className="bp-btn-label">Architecture</span>
            </button>
            <div className="state-badge">
              <span className="state-flag">🏛️</span>
              <span className="state-badge-text">Govt. of Maharashtra</span>
            </div>
          </div>
        </header>

        {/* View Routing */}
        <div className="view-content-wrapper">
          {activeView === 'candidate' && (
            <CandidatePortal
              selectedDistrict={selectedDistrict}
              setSelectedDistrict={setSelectedDistrict}
            />
          )}

          {activeView === 'institute' && (
            <InstitutesDashboard
              selectedDistrict={selectedDistrict}
              setSelectedDistrict={setSelectedDistrict}
            />
          )}

          {activeView === 'government' && (
            <GovernmentDashboard
              selectedDistrict={selectedDistrict}
              setSelectedDistrict={setSelectedDistrict}
            />
          )}

          {activeView === 'analytics' && (
            <GeneralAnalyticsDashboard />
          )}

          {activeView === 'feedback' && (
            <ContinuousFeedbackLoop />
          )}

          {activeView === 'ai_playground' && (
            <AIExtractionPlayground />
          )}
        </div>

        {/* Mobile Quick Bottom Navigation */}
        <nav className="mobile-bottom-nav">
          <button 
            className={`bottom-nav-item ${activeView === 'candidate' ? 'active' : ''}`}
            onClick={() => setActiveView('candidate')}
            title="Candidates Portal"
          >
            <GraduationCap size={20} />
            <span>Candidate</span>
          </button>

          <button 
            className={`bottom-nav-item ${activeView === 'institute' ? 'active' : ''}`}
            onClick={() => setActiveView('institute')}
            title="Institutes Dashboard"
          >
            <School size={20} />
            <span>Institute</span>
          </button>

          <button 
            className={`bottom-nav-item ${activeView === 'government' ? 'active' : ''}`}
            onClick={() => setActiveView('government')}
            title="Government Dashboard"
          >
            <Landmark size={20} />
            <span>Govt</span>
          </button>

          <button 
            className={`bottom-nav-item ${activeView === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveView('analytics')}
            title="Analytics"
          >
            <BarChart3 size={20} />
            <span>Analytics</span>
          </button>

          <button 
            className={`bottom-nav-item ${['feedback', 'ai_playground'].includes(activeView) ? 'active' : ''}`}
            onClick={() => setMobileMenuOpen(true)}
            title="More Options"
          >
            <Sparkles size={20} />
            <span>More</span>
          </button>
        </nav>
      </main>

      {/* Architecture Overview Modal */}
      <ArchitectureModal
        isOpen={showArchModal}
        onClose={() => setShowArchModal(false)}
      />
    </div>
  );
}
