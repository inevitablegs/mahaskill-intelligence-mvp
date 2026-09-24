
import React, { useState } from 'react';
import {
  Sparkles, FileText, CheckCircle2, Cpu, Tag,
  ArrowRight, RefreshCw, Key, ShieldCheck, Layers
} from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000';

export default function AIExtractionPlayground() {
  const [inputText, setInputText] = useState(
    `Looking for an experienced EV Powertrain Technician in Chakan, Pune.
Candidate must possess hands-on skills in Lithium-ion Battery Pack assembly, BMS diagnostics via CAN-Bus protocols, High Voltage safety disconnects (AIS-038 standards), and proficiency with diagnostic oscilloscopes. Prior experience with Tata Motors or Bajaj Auto EV line is preferred. Diploma in Electrical or Automobile Engineering required.`
  );
  const [jobTitle, setJobTitle] = useState('Senior EV Powertrain Diagnostic Technician');
  const [extracting, setExtracting] = useState(false);
  const [extractedSkills, setExtractedSkills] = useState(null);
  const [classifying, setClassifying] = useState(false);
  const [classificationResult, setClassificationResult] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [keyStatus, setKeyStatus] = useState(null);

  const handleExtractSkills = async () => {
    setExtracting(true);
    try {
      const res = await fetch(`${API_BASE}/api/ai/extract-skills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText, sector_context: 'Automotive / EV' }),
      });
      const data = await res.json();
      setExtractedSkills(data);
    } catch (err) {
      console.error("Skill extraction error:", err);
    } finally {
      setExtracting(false);
    }
  };

  const handleClassifyJob = async () => {
    setClassifying(true);
    try {
      const res = await fetch(`${API_BASE}/api/ai/classify-job`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_title: jobTitle, job_description: inputText }),
      });
      const data = await res.json();
      setClassificationResult(data);
    } catch (err) {
      console.error("Classification error:", err);
    } finally {
      setClassifying(false);
    }
  };

  const handleSetApiKey = async () => {
    if (!apiKey.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/ai/set-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey }),
      });
      const data = await res.json();
      setKeyStatus(data.gemini_active ? 'Gemini 2.5 Flash Connected & Active!' : 'Key updated');
    } catch (err) {
      console.error("Key update error:", err);
    }
  };

  return (
    <div className="portal-container animate-fade-in">
      <div className="portal-header ai-gradient">
        <div className="portal-header-left">
          <div className="badge-pill bg-purple-glow">
            <Sparkles size={16} /> Gemini 2.5 Flash Skill Intelligence Engine
          </div>
          <h2>AI & NLP Intelligence Layer for Maharashtra Job Postings</h2>
          <p>
            Transforms unstructured job postings, company requirement sheets, and syllabi into
            canonical skills, standardized taxonomy categories, and semantic matches.
          </p>
        </div>
      </div>

      <div className="ai-playground-grid">
        {/* Left Column: Input text */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3>Job Posting / Text Ingestion</h3>
              <p className="subtext">Paste any raw job specification from Maharashtra industry</p>
            </div>
            <span className="badge badge-ai"><Cpu size={14} /> Gemini 2.5 Flash</span>
          </div>

          <div className="form-group">
            <label>Job Title</label>
            <input
              type="text"
              className="input-field"
              value={jobTitle}
              onChange={e => setJobTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Job Description / Requirement Text</label>
            <textarea
              className="textarea-field"
              rows={8}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
            />
          </div>

          <div className="btn-group-row">
            <button
              className="btn btn-primary"
              onClick={handleExtractSkills}
              disabled={extracting}
            >
              {extracting ? (
                <><RefreshCw size={16} className="spin" /> Extracting Skills...</>
              ) : (
                <><Sparkles size={16} /> 1. Extract & Standardize Skills</>
              )}
            </button>
            <button
              className="btn btn-outline"
              onClick={handleClassifyJob}
              disabled={classifying}
            >
              {classifying ? (
                <><RefreshCw size={16} className="spin" /> Classifying...</>
              ) : (
                <><Tag size={16} /> 2. Classify to Sector Taxonomy</>
              )}
            </button>
          </div>

          {/* Optional API Key Input */}
          <div className="api-key-box mt-4">
            <label className="text-muted"><Key size={13} /> Gemini API Key Config (Optional / Runtime)</label>
            <div className="key-input-row">
              <input
                type="password"
                placeholder="Enter AI Studio Key..."
                className="input-field"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
              />
              <button className="btn btn-outline btn-sm" onClick={handleSetApiKey}>Update</button>
            </div>
            {keyStatus && <span className="text-success text-xs mt-1 display-block">{keyStatus}</span>}
          </div>
        </div>

        {/* Right Column: Output */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3>Extracted Intelligence & Canonical Output</h3>
              <p className="subtext">Standardized entities ready for database persistence</p>
            </div>
          </div>

          {classificationResult && (
            <div className="classification-box mb-4 animate-slide-up">
              <h4>🏷️ Sector Classification</h4>
              <div className="class-result-pill">
                <strong>{classificationResult.matched_sector || classificationResult.sector}</strong>
                <span>Confidence: {classificationResult.confidence || '94%'}</span>
              </div>
            </div>
          )}

          {extractedSkills ? (
            <div className="extracted-skills-container animate-slide-up">
              <h4>🔍 Extracted Skills ({extractedSkills.count || extractedSkills.skills?.length})</h4>
              <div className="skills-tags-grid">
                {extractedSkills.skills?.map((s, idx) => {
                  const sName = typeof s === 'string' ? s : s.skill;
                  const sCat = s.category || 'Technical';
                  const sProf = s.proficiency || 'intermediate';
                  return (
                    <div key={idx} className="extracted-skill-chip">
                      <strong>{sName}</strong>
                      <span className="skill-cat-tag">{sCat} • {sProf}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="empty-ai-state">
              <Sparkles size={40} className="text-purple-light" />
              <p>Click "Extract & Standardize Skills" to invoke Gemini NLP intelligence on the sample text.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
