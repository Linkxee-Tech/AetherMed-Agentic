import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion as motionLib, AnimatePresence } from 'framer-motion';
import { Send, Plus, History, Settings, User, Clock, AlertCircle, Menu, X, Mic, MicOff, HeartPulse, Shield, Languages } from 'lucide-react';
import AgentPulse from './components/AgentPulse';
import ReportCard from './components/ReportCard';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000/api/v1';
const CLIENT_ID_STORAGE_KEY = 'aethermed_client_id';
const HISTORY_STORAGE_NAMESPACE = 'aethermed_history';
const SETTINGS_STORAGE_NAMESPACE = 'aethermed_settings';
const LEGACY_HISTORY_STORAGE_KEY = 'aethermed_history';
const LEGACY_SETTINGS_STORAGE_KEY = 'aethermed_settings';
const MotionDiv = motionLib.div;
const DEFAULT_USER_SETTINGS = {
  defaultAgeRange: '18-35',
  theme: 'dark'
};
const URGENCY_MARKS = [
  { value: 1, label: '1', hint: 'Low' },
  { value: 2, label: '2', hint: 'Mild' },
  { value: 3, label: '3', hint: 'Moderate' },
  { value: 4, label: '4', hint: 'High' },
  { value: 5, label: '5', hint: 'Severe' },
];
const EXAMPLE_PROMPTS = [
  'Tight chest pain with sweating and trouble breathing',
  'High fever and vomiting since this morning',
  'Headache and dizziness that started after work',
];

function getScopedStorageKey(namespace, clientId) {
  return `${namespace}_${clientId}`;
}

function generateClientId() {
  if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `client-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function ensureClientId() {
  if (typeof window === 'undefined') {
    return 'server-render';
  }

  try {
    const existingId = window.localStorage.getItem(CLIENT_ID_STORAGE_KEY);
    if (existingId) {
      return existingId;
    }

    const createdId = generateClientId();
    window.localStorage.setItem(CLIENT_ID_STORAGE_KEY, createdId);
    return createdId;
  } catch {
    return 'local-session';
  }
}

function readScopedJson(namespace, clientId, legacyKey, fallbackValue) {
  if (typeof window === 'undefined') {
    return fallbackValue;
  }

  try {
    const scopedValue = window.localStorage.getItem(getScopedStorageKey(namespace, clientId));
    if (scopedValue) {
      return JSON.parse(scopedValue);
    }

    const legacyValue = window.localStorage.getItem(legacyKey);
    return legacyValue ? JSON.parse(legacyValue) : fallbackValue;
  } catch {
    return fallbackValue;
  }
}

function getDefaultTheme() {
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches) {
    return 'light';
  }

  return 'dark';
}

function buildDefaultUserSettings() {
  return {
    ...DEFAULT_USER_SETTINGS,
    theme: getDefaultTheme()
  };
}

function App() {
  const [clientId, setClientId] = useState(() => ensureClientId());
  const [userSettings, setUserSettings] = useState(() => {
    return readScopedJson(SETTINGS_STORAGE_NAMESPACE, clientId, LEGACY_SETTINGS_STORAGE_KEY, buildDefaultUserSettings());
  });
  const [symptoms, setSymptoms] = useState('');
  const [ageRange, setAgeRange] = useState(userSettings.defaultAgeRange || '18-35');
  const [urgency, setUrgency] = useState(3);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeAgent, setActiveAgent] = useState(null);
  const [completedAgents, setCompletedAgents] = useState([]);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [currentInsights, setCurrentInsights] = useState([]);
  const [systemStatus, setSystemStatus] = useState({ state: 'checking', mode: 'checking' });

  const [view, setView] = useState('assessment');
  const [sessionHistory, setSessionHistory] = useState(() => {
    return readScopedJson(HISTORY_STORAGE_NAMESPACE, clientId, LEGACY_HISTORY_STORAGE_KEY, []);
  });

  // Voice Interaction State
  const [listeningField, setListeningField] = useState(null); // 'symptoms' | 'notes' | null

  const agents = ['Translation', 'Triage', 'Research', 'Advice', 'Referral', 'Response'];
  const pageTitles = {
    assessment: {
      eyebrow: 'Safety-first symptom guidance',
      title: 'Tell us what you are feeling',
      description: 'Share your symptoms in plain language. We will organize them into a clearer next-step report without pretending to diagnose you.'
    },
    history: {
      eyebrow: 'Past sessions',
      title: 'Review earlier assessments',
      description: 'Reload a previous report to compare what changed or continue from an earlier session.'
    },
    settings: {
      eyebrow: 'Local preferences',
      title: 'Tune the experience to your style',
      description: 'Each browser or device gets its own local client profile automatically, with shared-device controls available only when needed.'
    }
  };
  const currentPage = pageTitles[view];
  const engineLabel = systemStatus.state === 'ready'
    ? `AMA: ${systemStatus.mode === 'offline' ? 'Clinical Engine' : 'Agentic'}`
    : systemStatus.state === 'offline'
      ? 'Backend unavailable'
      : 'Checking backend';
  const urgencyPercent = ((Number(urgency) - 1) / 4) * 100;

  useEffect(() => {
    try {
      const scopedSettingsKey = getScopedStorageKey(SETTINGS_STORAGE_NAMESPACE, clientId);
      const scopedHistoryKey = getScopedStorageKey(HISTORY_STORAGE_NAMESPACE, clientId);
      const legacySettings = window.localStorage.getItem(LEGACY_SETTINGS_STORAGE_KEY);
      const legacyHistory = window.localStorage.getItem(LEGACY_HISTORY_STORAGE_KEY);

      if (legacySettings && !window.localStorage.getItem(scopedSettingsKey)) {
        window.localStorage.setItem(scopedSettingsKey, legacySettings);
      }

      if (legacyHistory && !window.localStorage.getItem(scopedHistoryKey)) {
        window.localStorage.setItem(scopedHistoryKey, legacyHistory);
      }
    } catch {
      // Ignore storage migration issues and continue with current session state.
    }
  }, [clientId]);

  useEffect(() => {
    const nextSettings = readScopedJson(
      SETTINGS_STORAGE_NAMESPACE,
      clientId,
      LEGACY_SETTINGS_STORAGE_KEY,
      buildDefaultUserSettings()
    );
    const nextHistory = readScopedJson(HISTORY_STORAGE_NAMESPACE, clientId, LEGACY_HISTORY_STORAGE_KEY, []);

    setUserSettings(nextSettings);
    setAgeRange(nextSettings.defaultAgeRange || '18-35');
    setSessionHistory(nextHistory);
    setReport(null);
    setError(null);
    setSymptoms('');
    setNotes('');
    setUrgency(3);
    setCompletedAgents([]);
    setCurrentInsights([]);
    setActiveAgent(null);
    setLoading(false);
    setShowLogs(false);
  }, [clientId]);

  useEffect(() => {
    window.localStorage.setItem(
      getScopedStorageKey(SETTINGS_STORAGE_NAMESPACE, clientId),
      JSON.stringify(userSettings)
    );
  }, [clientId, userSettings]);

  useEffect(() => {
    document.documentElement.dataset.theme = userSettings.theme;
  }, [userSettings.theme]);

  useEffect(() => {
    let ignore = false;

    async function fetchHealth() {
      try {
        const response = await axios.get(`${API_BASE}/health`);
        if (!ignore) {
          setSystemStatus({
            state: 'ready',
            mode: response.data.agentMode,
            database: response.data.database,
          });
        }
      } catch {
        if (!ignore) {
          setSystemStatus({ state: 'offline', mode: 'unavailable', database: 'unavailable' });
        }
      }
    }

    fetchHealth();

    return () => {
      ignore = true;
    };
  }, []);

  // Web Speech API Logic
  const startListening = (field, setter, currentText) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support the Web Speech API. Please try Chrome or Edge.");
      return;
    }

    // Stop currently listening process if requested again
    if (listeningField === field) {
        setListeningField(null);
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setListeningField(field);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      // Append logic: add a space if there's already text
      const newText = currentText.trim() ? `${currentText} ${transcript}` : transcript;
      setter(newText);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setListeningField(null);
    };

    recognition.onend = () => {
      setListeningField(null);
    };

    recognition.start();
  };

  const handleSwitchLocalProfile = () => {
    const nextClientId = generateClientId();

    try {
      window.localStorage.setItem(CLIENT_ID_STORAGE_KEY, nextClientId);
    } catch {
      // Ignore storage write errors and continue with in-memory profile rotation.
    }

    setClientId(nextClientId);
  };

  const handleResetLocalProfile = () => {
    try {
      window.localStorage.removeItem(getScopedStorageKey(SETTINGS_STORAGE_NAMESPACE, clientId));
      window.localStorage.removeItem(getScopedStorageKey(HISTORY_STORAGE_NAMESPACE, clientId));
    } catch {
      // Ignore storage removal errors and still reset the visible session state.
    }

    const nextSettings = buildDefaultUserSettings();
    setUserSettings(nextSettings);
    setAgeRange(nextSettings.defaultAgeRange);
    setSessionHistory([]);
    setReport(null);
    setError(null);
    setSymptoms('');
    setNotes('');
    setUrgency(3);
    setCompletedAgents([]);
    setCurrentInsights([]);
    setActiveAgent(null);
    setLoading(false);
    setShowLogs(false);
    setView('assessment');
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!symptoms.trim()) return;

    setLoading(true);
    setReport(null);
    setError(null);
    setCompletedAgents([]);
    setCurrentInsights([]);
    setShowLogs(false);
    setIsSidebarOpen(false); // Close sidebar on mobile when starting analysis
    
    try {
      const response = await axios.post(`${API_BASE}/analyze`, { 
        symptoms, 
        ageRange, 
        urgency, 
        notes,
        clientId
      });
      
      const serverTrace = response.data.trace || [];
      
      for (const step of serverTrace) {
        setActiveAgent(step.agent);
        setCurrentInsights(prev => [...prev, step.insight]);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setCompletedAgents(prev => [...prev, step.agent]);
      }

      setActiveAgent(null);
      const reportData = response.data.data;
      setReport(reportData);

      const newHistoryItem = {
          id: response.data.sessionId,
          date: new Date().toLocaleString(),
          symptoms: symptoms.substring(0, 100) + '...',
          clientId,
          report: reportData
      };
      setSessionHistory(prev => {
          const updated = [newHistoryItem, ...prev];
          window.localStorage.setItem(
            getScopedStorageKey(HISTORY_STORAGE_NAMESPACE, clientId),
            JSON.stringify(updated)
          );
          return updated;
      });
    } catch (err) {
      setError(`Cannot reach the AetherMed backend at ${API_BASE}. Start it with "npm run backend" or run the full app from the project root with "npm run dev".`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="layout">
      {/* Mobile Header */}
      <header className="mobile-navbar glass">
        <button className="menu-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <div className="mobile-navbar-copy">
          <div className="logo-icon">
            <img src="/logo.png" alt="AetherMed AI" style={{ width: '100%', height: '100%', transform: 'scale(1.35)', transition: 'transform 0.4s ease', objectFit: 'cover' }} />
          </div>
          <span className={`engine-pill compact ${systemStatus.state}`}>{engineLabel}</span>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`sidebar glass ${isSidebarOpen ? 'open' : ''}`}>
        <div className="logo">
          <div className="logo-icon">
            <img src="/logo.png" alt="AetherMed AI" style={{ width: '100%', height: '100%', transform: 'scale(1.35)', transition: 'transform 0.4s ease', objectFit: 'cover' }} />
          </div>
          <span className="brand-text">AetherMed <span className="brand-accent">Agentic</span></span>
        </div>
        <nav>
          <button className={`nav-item ${view === 'assessment' ? 'active' : ''}`} onClick={() => { setView('assessment'); setReport(null); setIsSidebarOpen(false); }}>
            <Plus size={18} /> New Session
          </button>
          <button className={`nav-item ${view === 'history' ? 'active' : ''}`} onClick={() => { setView('history'); setIsSidebarOpen(false); }}>
            <History size={18} /> History
          </button>
          <button className={`nav-item ${view === 'settings' ? 'active' : ''}`} onClick={() => { setView('settings'); setIsSidebarOpen(false); }}>
            <Settings size={18} /> Settings
          </button>
        </nav>
        <div className="user-profile">
          <User size={18} /> Local profile
        </div>
      </aside>

      {/* Backdrop for mobile sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <MotionDiv 
            className="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="main-content">
        <header className="main-header">
          <div className="header-copy">
            <div className="breadcrumb">{currentPage.eyebrow}</div>
            <div className="page-title">{currentPage.title}</div>
          </div>
          <div className="header-actions">
            <span className={`engine-pill ${systemStatus.state}`}>{engineLabel}</span>
            <Clock size={16} /> <span id="time">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </header>

        <section className="consultation-area">
          <div className="page-intro">
            <span className="section-kicker">{currentPage.eyebrow}</span>
            <h1>{currentPage.title}</h1>
            <p>{currentPage.description}</p>
          </div>

          {view === 'history' && (
             <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="history-view glass" style={{ padding: '32px', width: '100%', maxWidth: '800px', marginTop: '20px', textAlign: 'left' }}>
                <h2>Session History</h2>
                {sessionHistory.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', marginTop: '16px' }}>No saved assessments yet. Run a scan to build history.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
                        {sessionHistory.map(session => (
                            <div key={session.id} style={{ background: 'var(--surface-muted)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{session.date}</div>
                                <div style={{ fontWeight: '500', margin: '12px 0', color: 'var(--text-primary)', fontSize: '15px' }}>"{session.symptoms}"</div>
                                <button className="reset-btn" style={{ padding: '8px 16px', fontSize: '13px' }} onClick={() => { setReport(session.report); setView('assessment'); }}>
                                   Load Assessment View
                                </button>
                            </div>
                        ))}
                    </div>
                )}
             </MotionDiv>
          )}

          {view === 'settings' && (
             <MotionDiv initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="settings-view glass" style={{ padding: '32px', width: '100%', maxWidth: '800px', marginTop: '20px', textAlign: 'left' }}>
                <h2>Local Settings</h2>
                <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>A unique local client ID is created automatically for each browser or device. Switching is only needed if multiple people share the same browser profile.</p>
                <div className="profile-chip">
                  <strong>Local client ID</strong>
                  <span>{clientId}</span>
                </div>
                <div className="profile-actions">
                  <button
                    type="button"
                    className="profile-action-btn"
                    onClick={handleSwitchLocalProfile}
                  >
                    Switch local profile
                  </button>
                  <button
                    type="button"
                    className="profile-action-btn danger"
                    onClick={handleResetLocalProfile}
                  >
                    Reset this profile
                  </button>
                </div>
                <div className="input-group" style={{ marginTop: '32px', background: 'transparent', boxShadow: 'none' }}>
                    <div className="form-field">
                        <label>Default Visual Theme</label>
                        <select value={userSettings.theme} onChange={(e) => setUserSettings({...userSettings, theme: e.target.value})}>
                            <option value="dark">Calm Night</option>
                            <option value="light">Clinical Light</option>
                        </select>
                    </div>
                    <div className="form-field" style={{ marginTop: '16px' }}>
                        <label>Default Base Profile (Age)</label>
                        <select value={userSettings.defaultAgeRange} onChange={(e) => {
                            const val = e.target.value;
                            setUserSettings({...userSettings, defaultAgeRange: val});
                            setAgeRange(val);
                        }}>
                            <option value="0-18">0-18 Years</option>
                            <option value="18-35">18-35 Years</option>
                            <option value="36-50">36-50 Years</option>
                            <option value="51-65">51-65 Years</option>
                            <option value="65+">65+ Years</option>
                        </select>
                    </div>
                </div>
             </MotionDiv>
          )}

          {view === 'assessment' && !report && !loading && (
            <MotionDiv 
              className="welcome-box"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="hero-panel">
                <div className="hero-copy">
                  <span className="section-kicker">Designed for clarity</span>
                  <h2 className="hero-title">A calmer way to explain symptoms and get structured guidance</h2>
                  <p className="hero-text">
                    Start with your own words. AetherMed turns what you say into a simple urgency summary,
                    suggested next steps, and a care path you can actually act on.
                  </p>
                </div>

                <div className="trust-strip">
                  <div className="trust-card">
                    <Shield size={18} />
                    <div>
                      <strong>Safety-first</strong>
                      <span>Built to escalate red flags, not guess diagnoses.</span>
                    </div>
                  </div>
                  <div className="trust-card">
                    <HeartPulse size={18} />
                    <div>
                      <strong>Action-focused</strong>
                      <span>You get next steps, urgency, and a care path in one view.</span>
                    </div>
                  </div>
                  <div className="trust-card">
                    <Languages size={18} />
                    <div>
                      <strong>Multilingual intake</strong>
                      <span>Users can describe symptoms naturally before review is normalized.</span>
                    </div>
                  </div>
                </div>

                <div className="example-prompts">
                  {EXAMPLE_PROMPTS.map((example) => (
                    <button
                      key={example}
                      type="button"
                      className="example-chip"
                      onClick={() => {
                        setSymptoms(example);
                        setView('assessment');
                      }}
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
              
              <form onSubmit={handleAnalyze} className="input-group glass">
                <div className="form-row">
                  <div className="form-field">
                    <label>Age Range</label>
                    <select value={ageRange} onChange={(e) => setAgeRange(e.target.value)}>
                      <option value="0-18">0-18</option>
                      <option value="18-35">18-35</option>
                      <option value="36-50">36-50</option>
                      <option value="51-65">51-65</option>
                      <option value="65+">65+</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label>Urgency (1-5)</label>
                    <input 
                      type="range" 
                      min="1"
                      max="5"
                      step="1"
                      value={urgency} 
                      onChange={(e) => setUrgency(Number(e.target.value))}
                      style={{
                        background: `linear-gradient(90deg, var(--success) 0%, #facc15 ${Math.max(urgencyPercent, 10)}%, var(--surface-muted) ${Math.max(urgencyPercent, 10)}%, var(--surface-muted) 100%)`
                      }}
                    />
                    <div className="urgency-scale" aria-hidden="true">
                      {URGENCY_MARKS.map((mark) => (
                        <div
                          key={mark.value}
                          className={`urgency-mark ${Number(urgency) === mark.value ? 'active' : ''}`}
                        >
                          <span>{mark.label}</span>
                          <small>{mark.hint}</small>
                        </div>
                      ))}
                    </div>
                    <div className="urgency-value">Selected: {urgency} of 5</div>
                  </div>
                </div>

                <div className="form-field">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label>Primary Symptoms</label>
                    <button 
                      type="button" 
                      className={`mic-btn ${listeningField === 'symptoms' ? 'recording' : ''}`}
                      onClick={() => startListening('symptoms', setSymptoms, symptoms)}
                      title="Dictate symptoms"
                    >
                      {listeningField === 'symptoms' ? <Mic size={16} /> : <MicOff size={16} />}
                    </button>
                  </div>
                  <textarea 
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="e.g., Intense chest pain with shortness of breath for the last 20 minutes..."
                    rows={3}
                    required
                  />
                </div>

                <div className="form-field">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label>Optional Notes (Medical History)</label>
                    <button 
                      type="button" 
                      className={`mic-btn ${listeningField === 'notes' ? 'recording' : ''}`}
                      onClick={() => startListening('notes', setNotes, notes)}
                      title="Dictate notes"
                    >
                      {listeningField === 'notes' ? <Mic size={16} /> : <MicOff size={16} />}
                    </button>
                  </div>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g., History of hypertension..."
                    rows={2}
                  />
                </div>

                <button type="submit" disabled={!symptoms.trim() || loading}>
                  {loading ? 'Reviewing symptoms...' : <><Send size={18} /> Get Guidance</>}
                </button>
                <div className="support-note">
                  If symptoms feel life-threatening, skip this tool and call local emergency services immediately.
                </div>
              </form>
            </MotionDiv>
          )}

          {loading && (
            <div className="orchestrator-view glass">
              <div className="view-header">
                <h3>Reviewing your symptoms</h3>
                <div className="status-badge pulse-active">In progress</div>
              </div>
              <p className="loading-copy">
                We are organizing your intake into a clearer urgency summary, practical next steps, and a care path.
              </p>
              <div className="agent-stack">
                {agents.map(agent => (
                  <AgentPulse 
                    key={agent}
                    name={agent}
                    active={activeAgent === agent}
                    complete={completedAgents.includes(agent)}
                  />
                ))}
              </div>

              <div style={{ marginTop: '24px', textAlign: 'center' }}>
                  <button className="reset-btn" style={{ fontSize: '12px' }} onClick={() => setShowLogs(!showLogs)}>
                      {showLogs ? 'Hide Technical Insights' : 'Inspect Agent Reasoning...'}
                  </button>
              </div>

              <AnimatePresence>
                {showLogs && (
                    <MotionDiv 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: 'auto', opacity: 1 }} 
                        exit={{ height: 0, opacity: 0 }}
                        className="trace-log"
                        style={{ marginTop: '16px', overflow: 'hidden' }}
                    >
                        {currentInsights.map((insight, idx) => (
                            <div key={idx} style={{ marginBottom: '8px', borderLeft: '2px solid var(--primary)', paddingLeft: '12px' }}>
                                <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>&gt; </span>
                                {insight}
                            </div>
                        ))}
                    </MotionDiv>
                )}
              </AnimatePresence>
            </div>
          )}

          {error && (
            <div className="error-box glass">
              <AlertCircle size={24} color="var(--danger)" />
              <p>{error}</p>
            </div>
          )}

          {report && (
            <div className="results-container">
              <ReportCard data={report} />
              <button className="reset-btn" onClick={() => setReport(null)}>
                <Plus size={18} /> New Assessment
              </button>
            </div>
          )}
        </section>
      </main>

      <style>{`
        .layout { display: flex; min-height: 100vh; width: 100%; position: relative; overflow: hidden; color: var(--text-primary); }

        .mobile-navbar {
          display: none;
          position: fixed;
          top: 0; left: 0; right: 0;
          min-height: 72px;
          padding: 12px 18px;
          z-index: 100;
          align-items: center;
          gap: 12px;
          border-radius: 0;
          border-bottom: 1px solid var(--border-color);
          background: color-mix(in srgb, var(--bg-card) 90%, transparent);
        }

        .menu-toggle { background: transparent; border: 0; color: var(--text-primary); cursor: pointer; display: flex; align-items: center; }
        .mobile-navbar-copy { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
        .logo-compact { display: flex; align-items: center; gap: 8px; }
        .logo-compact span { font-weight: 700; font-size: 16px; color: var(--text-primary); }

        .sidebar {
          width: var(--sidebar-width);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          padding: 28px 24px;
          border-right: 1px solid var(--border-color);
          z-index: 110;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          background: color-mix(in srgb, var(--bg-card) 94%, transparent);
        }

        .sidebar-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(2, 6, 23, 0.48);
          backdrop-filter: blur(4px);
          z-index: 105;
          display: none;
        }

        .logo { display: flex; align-items: center; gap: 12px; margin-bottom: 48px; }
        .logo-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 12px 32px var(--primary-glow);
          overflow: hidden;
          background: #09111f;
          border: 2px solid var(--primary-glow);
        }
        .logo .brand-text {
          font-weight: 800;
          font-size: 26px;
          color: var(--text-primary);
          letter-spacing: -0.5px;
          background: linear-gradient(135deg, #fff 0%, var(--text-secondary) 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .logo .brand-accent {
          display: block;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 2px;
          color: var(--primary);
          -webkit-text-fill-color: var(--primary);
          margin-top: -4px;
        }

        nav { flex: 1; display: flex; flex-direction: column; gap: 8px; }
        .nav-item {
          background: transparent;
          border: 0;
          color: var(--text-secondary);
          padding: 12px 16px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
          width: 100%;
        }
        .nav-item:hover { background: var(--surface-muted); color: var(--text-primary); }
        .nav-item.active { background: var(--surface-soft); color: var(--primary); }
        .user-profile {
          margin-top: auto;
          padding-top: 24px;
          border-top: 1px solid var(--border-color);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
        }

        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          position: relative;
          background: radial-gradient(circle at center, rgba(56, 189, 248, 0.05), transparent 38%);
        }

        .main-header {
          padding: 20px 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border-color);
          background: color-mix(in srgb, var(--bg-card) 90%, transparent);
          backdrop-filter: blur(10px);
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .header-copy { display: flex; flex-direction: column; gap: 4px; }
        .breadcrumb, .section-kicker {
          font-size: 12px;
          color: var(--text-muted);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1.4px;
        }
        .page-title {
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .header-actions { color: var(--text-muted); font-size: 13px; display: flex; align-items: center; gap: 10px; }
        .engine-pill {
          padding: 7px 12px;
          border-radius: 999px;
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          background: var(--surface-strong);
          white-space: nowrap;
        }
        .engine-pill.ready { color: var(--success); background: var(--success-soft); }
        .engine-pill.offline { color: var(--danger); background: var(--danger-soft); }
        .engine-pill.compact {
          font-size: 11px;
          padding: 5px 10px;
          max-width: min(68vw, 280px);
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .consultation-area {
          flex: 1;
          padding: 48px 40px 64px;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
        }

        .page-intro {
          width: 100%;
          max-width: 960px;
          margin-bottom: 28px;
          text-align: left;
        }

        .page-intro h1 {
          font-size: clamp(2.3rem, 5vw, 3.6rem);
          line-height: 1.02;
          margin: 10px 0 14px;
          font-weight: 800;
          letter-spacing: -1.4px;
          max-width: 12ch;
        }

        .page-intro p {
          color: var(--text-secondary);
          font-size: clamp(1rem, 1.8vw, 1.1rem);
          margin: 0;
          max-width: 62ch;
          line-height: 1.7;
        }

        .welcome-box { max-width: 960px; width: 100%; display: flex; flex-direction: column; gap: 24px; margin-top: 0; }
        .hero-panel {
          background: linear-gradient(155deg, color-mix(in srgb, var(--bg-card) 96%, transparent), color-mix(in srgb, var(--surface-strong) 72%, transparent));
          border: 1px solid var(--border-color);
          border-radius: 24px;
          padding: clamp(22px, 4vw, 32px);
          box-shadow: var(--glass-shadow);
        }
        .hero-copy { max-width: 64ch; }
        .hero-title {
          font-size: clamp(1.7rem, 3vw, 2.4rem);
          line-height: 1.1;
          margin: 12px 0;
          color: var(--text-primary);
          letter-spacing: -0.8px;
        }
        .hero-text {
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.75;
          font-size: 1rem;
        }
        .trust-strip {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
          margin-top: 24px;
        }
        .trust-card {
          background: var(--surface-muted);
          border: 1px solid var(--border-color);
          border-radius: 18px;
          padding: 16px;
          display: flex;
          gap: 12px;
          align-items: flex-start;
          color: var(--text-secondary);
        }
        .trust-card strong {
          display: block;
          color: var(--text-primary);
          margin-bottom: 4px;
          font-size: 14px;
        }
        .trust-card span {
          font-size: 13px;
          line-height: 1.5;
        }
        .example-prompts {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 22px;
        }
        .example-chip {
          border: 1px solid var(--border-color);
          background: transparent;
          color: var(--text-secondary);
          padding: 10px 14px;
          border-radius: 999px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .example-chip:hover {
          background: var(--surface-soft);
          color: var(--text-primary);
          border-color: color-mix(in srgb, var(--primary) 35%, var(--border-color));
        }

        .input-group {
          padding: clamp(22px, 4vw, 32px);
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 20px;
          text-align: left;
          background: color-mix(in srgb, var(--bg-card) 94%, transparent);
          box-shadow: var(--glass-shadow);
        }

        .form-row { display: flex; gap: 20px; }
        .form-field { display: flex; flex-direction: column; gap: 10px; flex: 1; }
        .form-field label {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.9px;
        }

        select, textarea {
          background: var(--surface-strong);
          border: 1px solid var(--border-color);
          border-radius: 14px;
          padding: 14px 16px;
          color: var(--text-primary);
          width: 100%;
        }
        select:focus, textarea:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px var(--primary-glow);
        }
        input[type="range"] {
          width: 100%;
          appearance: none;
          -webkit-appearance: none;
          height: 10px;
          border-radius: 999px;
          border: 0;
          padding: 0;
          cursor: pointer;
          background: linear-gradient(90deg, var(--success) 0%, #facc15 50%, var(--surface-muted) 50%, var(--surface-muted) 100%);
        }
        input[type="range"]:focus {
          outline: none;
        }
        input[type="range"]::-webkit-slider-runnable-track {
          height: 10px;
          border-radius: 999px;
          background: transparent;
        }
        input[type="range"]::-moz-range-track {
          height: 10px;
          border-radius: 999px;
          background: transparent;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          margin-top: -6px;
          border: 3px solid white;
          background: var(--primary-strong);
          box-shadow: 0 6px 18px rgba(15, 23, 42, 0.22);
        }
        input[type="range"]::-moz-range-thumb {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: 3px solid white;
          background: var(--primary-strong);
          box-shadow: 0 6px 18px rgba(15, 23, 42, 0.22);
        }
        .urgency-scale {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 8px;
          margin-top: 10px;
        }
        .urgency-mark {
          text-align: center;
          color: var(--text-muted);
          font-size: 11px;
          line-height: 1.2;
        }
        .urgency-mark span {
          display: block;
          font-weight: 700;
          color: var(--text-secondary);
          margin-bottom: 2px;
        }
        .urgency-mark small {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .urgency-mark.active span,
        .urgency-mark.active small {
          color: var(--primary);
        }
        .urgency-value {
          font-size: 12px;
          color: var(--primary);
          text-align: right;
          margin-top: 2px;
          font-weight: 700;
        }

        textarea {
          font-size: 15px;
          resize: vertical;
          min-height: 110px;
          line-height: 1.6;
        }

        .mic-btn {
          background: transparent;
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .mic-btn:hover { background: var(--surface-muted); color: var(--text-primary); }
        .mic-btn.recording { background: var(--danger-soft); color: var(--danger); border-color: var(--danger); animation: pulse-record 1.5s infinite; }

        @keyframes pulse-record {
            0% { box-shadow: 0 0 0 0 rgba(248, 113, 113, 0.35); }
            70% { box-shadow: 0 0 0 6px rgba(248, 113, 113, 0); }
            100% { box-shadow: 0 0 0 0 rgba(248, 113, 113, 0); }
        }

        button[type="submit"] {
          background: linear-gradient(135deg, var(--primary-strong), var(--secondary));
          color: white;
          border: 0;
          padding: 16px;
          border-radius: 14px;
          font-weight: 700;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin-top: 8px;
          box-shadow: 0 16px 34px var(--primary-glow);
        }
        button[type="submit"]:hover:not(:disabled) { transform: translateY(-2px); }
        button[type="submit"]:disabled { opacity: 0.7; cursor: not-allowed; }
        .support-note {
          color: var(--text-muted);
          font-size: 12px;
          line-height: 1.6;
          text-align: center;
        }
        .profile-chip {
          margin-top: 18px;
          padding: 14px 16px;
          border: 1px solid var(--border-color);
          border-radius: 14px;
          background: var(--surface-muted);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .profile-chip strong {
          color: var(--text-primary);
          font-size: 13px;
        }
        .profile-chip span {
          color: var(--text-secondary);
          font-size: 12px;
          word-break: break-all;
        }
        .profile-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 14px;
        }
        .profile-action-btn {
          background: var(--surface-strong);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 12px 16px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .profile-action-btn:hover {
          background: var(--surface-soft);
        }
        .profile-action-btn.danger {
          color: var(--danger);
          border-color: color-mix(in srgb, var(--danger) 30%, var(--border-color));
          background: var(--danger-soft);
        }

        .orchestrator-view {
          max-width: 720px;
          width: 100%;
          padding: clamp(20px, 5vw, 32px);
          border-top: 3px solid var(--primary);
          margin-top: 20px;
        }
        .view-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; gap: 12px; }
        .view-header h3 {
          margin: 0;
          font-size: 14px;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .status-badge {
          border-radius: 999px;
          padding: 6px 12px;
          background: var(--surface-soft);
          color: var(--primary);
          font-size: 12px;
          font-weight: 700;
        }
        .loading-copy {
          color: var(--text-secondary);
          margin: 0 0 20px;
          line-height: 1.6;
        }
        .agent-stack { display: flex; flex-direction: column; gap: 12px; }

        .results-container { width: 100%; display: flex; flex-direction: column; align-items: center; padding-bottom: 40px; }
        .error-box {
          width: 100%;
          max-width: 720px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 18px 20px;
          border-left: 4px solid var(--danger);
          color: var(--text-secondary);
          background: var(--danger-soft);
        }
        .error-box p {
          margin: 0;
          color: var(--text-primary);
          font-size: 14px;
          line-height: 1.6;
        }
        .reset-btn {
          margin-top: 24px;
          background: transparent;
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          padding: 10px 20px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .reset-btn:hover {
          background: var(--surface-muted);
          color: var(--text-primary);
        }

        @media (max-width: 900px) {
          .trust-strip { grid-template-columns: 1fr; }
        }

        @media (max-width: 1024px) {
          .sidebar { width: 240px; }
          .main-header, .consultation-area { padding-left: 24px; padding-right: 24px; }
        }

        @media (max-width: 768px) {
          .mobile-navbar { display: flex; }
          .main-header { display: none; }
          .sidebar {
            position: fixed;
            left: 0; top: 0; bottom: 0;
            transform: translateX(-100%);
            border-radius: 0;
            width: 82%;
            max-width: 320px;
          }
          .sidebar.open { transform: translateX(0); }
          .sidebar-backdrop { display: block; }
          .main-content { padding-top: 78px; }
          .consultation-area { padding: 28px 20px 40px; }
          .page-intro { margin-bottom: 20px; }
          .page-intro h1 { max-width: 14ch; }
          .welcome-box { gap: 18px; }
        }

        @media (max-width: 600px) {
          .form-row { flex-direction: column; gap: 16px; }
          .example-prompts { gap: 8px; }
          .example-chip { width: 100%; text-align: left; }
        }

        @media (max-width: 480px) {
          .orchestrator-view { padding: 20px; }
          .input-group { padding: 16px; }
          .nav-item { padding: 10px; font-size: 14px; }
          .hero-panel { border-radius: 18px; }
          .trust-card { padding: 14px; }
        }
      `}</style>
    </div>
  );
}

export default App;
