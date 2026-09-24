
import React from 'react';
import {
  Workflow, Database, Cpu, Layers, Sliders, GraduationCap,
  School, Landmark, RotateCcw, X, CheckCircle
} from 'lucide-react';

export default function ArchitectureModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card arch-modal animate-scale-up">
        <div className="modal-header">
          <div className="arch-modal-title">
            <Workflow size={22} className="text-purple" />
            <div>
              <h3>MahaSkill Intelligence — End-to-End System Architecture</h3>
              <p className="subtext">Implemented Continuous Labour Market & Curriculum Alignment Pipeline</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="arch-flow-diagram">
          {/* Step 1: Data Sources & ETL */}
          <div className="arch-tier-box">
            <div className="tier-header bg-yellow-pale">
              <Database size={16} /> 1. DATA SOURCES & INGESTION
            </div>
            <div className="tier-content">
              <span>• MSSDS MSNAS 2023 Survey</span>
              <span>• District Skill Plans (DSDP)</span>
              <span>• Industry Employment Data</span>
              <span>• Live Candidate Aspirations</span>
            </div>
          </div>

          <div className="arch-arrow">➔</div>

          {/* Step 2: AI / NLP */}
          <div className="arch-tier-box">
            <div className="tier-header bg-cyan-pale">
              <Cpu size={16} /> 2. AI / NLP INTELLIGENCE
            </div>
            <div className="tier-content">
              <span>• Gemini 2.5 Flash LLM</span>
              <span>• Skill Extraction from Free Text</span>
              <span>• Taxonomy Normalization</span>
              <span>• Semantic Role-Skill Similarity</span>
            </div>
          </div>

          <div className="arch-arrow">➔</div>

          {/* Step 3: Skill Knowledge Layer & Engine */}
          <div className="arch-tier-box">
            <div className="tier-header bg-blue-pale">
              <Layers size={16} /> 3. INTELLIGENCE & RECOMMENDATIONS
            </div>
            <div className="tier-content">
              <span>• Demand Index & Mismatch Score</span>
              <span>• Curriculum Gap Diagnosis</span>
              <span>• Trainer Upskilling Matrix</span>
              <span>• Lab Hardware Gap Audit</span>
            </div>
          </div>

          <div className="arch-arrow">➔</div>

          {/* Step 4: 3 Dashboards */}
          <div className="arch-dashboards-cluster">
            <div className="dash-pill candidate-pill">
              <GraduationCap size={16} />
              <strong>Candidates Portal</strong>
              <span>Assessment • Pathway • Gaps</span>
            </div>
            <div className="dash-pill institute-pill">
              <School size={16} />
              <strong>Institutes Dashboard</strong>
              <span>Courses • Modernization • Labs</span>
            </div>
            <div className="dash-pill govt-pill">
              <Landmark size={16} />
              <strong>Government Dashboard</strong>
              <span>Trends • Matrix • What-If Sim</span>
            </div>
          </div>

          <div className="arch-arrow">➔</div>

          {/* Step 5: Continuous Feedback */}
          <div className="arch-tier-box">
            <div className="tier-header bg-pink-pale">
              <RotateCcw size={16} /> 4. CONTINUOUS UPDATE LOOP
            </div>
            <div className="tier-content">
              <span>• Employer Hiring Outcomes</span>
              <span>• Shopfloor Skill Gaps</span>
              <span>• Salary & 6-Mo Retention</span>
              <span>• Automatic Syllabus Refinement</span>
            </div>
          </div>
        </div>

        <div className="arch-footer">
          <span className="badge badge-success"><CheckCircle size={14} /> Full Pipeline Operational & Live</span>
          <button className="btn btn-primary" onClick={onClose}>Explore Platform</button>
        </div>
      </div>
    </div>
  );
}
