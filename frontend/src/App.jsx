
import React, { useState, useEffect } from 'react';
import {
  GraduationCap, School, Landmark, RotateCcw, Sparkles,
  LayoutDashboard, MapPin, CircleAlert, Workflow, ChevronRight,
  ShieldCheck, Cpu, Database
} from 'lucide-react';

import CandidatePortal from './components/CandidatePortal';
import InstitutesDashboard from './components/InstitutesDashboard';
import GovernmentDashboard from './components/GovernmentDashboard';
import ContinuousFeedbackLoop from './components/ContinuousFeedbackLoop';
import AIExtractionPlayground from './components/AIExtractionPlayground';
import ArchitectureModal from './components/ArchitectureModal';

const API_BASE = 'http://127.0.0.1:8000';

export default function App() {
  const [activeView, setActiveView] = useState('candidate'); // 'candidate' | 'institute' | 'government' | 'feedback' | 'ai_playground'
  const [selectedDistrict, setSelectedDistrict] = useState('Pune');
  const [showArchModal, setShowArchModal] = useState(false);
  const [geminiActive, setGeminiActive] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/health`)
      .then(res => res.json())
      .then(data => {
        if (data.gemini_active) setGeminiActive(true);
      })
      .catch(err => console.error("Health check error:", err));
  }, []);

  const navItems = [
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
      badge: 'Individual',
      desc: 'Curricula, Labs, Trainers & Batches',
    },
    {
      id: 'government',
      label: 'Government Dashboard',
      icon: <Landmark size={18} />,
      badge: 'Individual',
      desc: '36-District Trends & What-If Sim',
    },
    {
      id: 'feedback',
      label: 'Continuous Update Loop',
      icon: <RotateCcw size={18} />,
      badge: 'Feedback',
      desc: 'Employer Outcomes & Telemetry',
    },
    {
      id: 'ai_playground',
      label: 'Gemini AI / NLP Playground',
      icon: <Sparkles size={18} />,
      badge: 'LLM',
      desc: 'Live Skill Extraction & Mapping',
    },
  ];

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand" onClick={() => setShowArchModal(true)} style={{ cursor: 'pointer' }}>
          <div className="brand-mark">
            <Cpu size={24} />
          </div>
          <div>
            <strong>MahaSkill</strong>
            <span>INTELLIGENCE 3.0</span>
          </div>
        </div>

        <div className="side-label">3 SEPARATE DASHBOARDS</div>
        {navItems.slice(0, 3).map(item => (
          <button
            key={item.id}
            className={`nav-item ${activeView === item.id ? 'active' : ''}`}
            onClick={() => setActiveView(item.id)}
          >
            <span className="nav-icon-wrap">{item.icon}</span>
            <div className="nav-text-col">
              <div className="nav-title-row">
                <span>{item.label}</span>
              </div>
              <small className="nav-sub">{item.desc}</small>
            </div>
          </button>
        ))}

        <div className="side-label mt-4">CONTINUOUS LOOP & AI</div>
        {navItems.slice(3).map(item => (
          <button
            key={item.id}
            className={`nav-item ${activeView === item.id ? 'active' : ''}`}
            onClick={() => setActiveView(item.id)}
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
          <button className="arch-blueprint-btn" onClick={() => setShowArchModal(true)}>
            <Workflow size={16} /> View System Architecture
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
            <span className="topbar-breadcrumb">
              Maharashtra Skill Development Ecosystem ➔ <strong>{navItems.find(n => n.id === activeView)?.label}</strong>
            </span>
          </div>

          <div className="topbar-right">
            <button className="btn btn-outline btn-sm" onClick={() => setShowArchModal(true)}>
              <Workflow size={14} /> Technical Flow Blueprint
            </button>
            <div className="state-badge">
              <span className="state-flag">🏛️</span>
              <span>Govt. of Maharashtra</span>
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

          {activeView === 'feedback' && (
            <ContinuousFeedbackLoop />
          )}

          {activeView === 'ai_playground' && (
            <AIExtractionPlayground />
          )}
        </div>
      </main>

      {/* Architecture Overview Modal */}
      <ArchitectureModal
        isOpen={showArchModal}
        onClose={() => setShowArchModal(false)}
      />
    </div>
  );
}
