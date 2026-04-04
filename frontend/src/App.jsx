import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Plus, History, Settings, User, Clock, AlertCircle, Menu, X, Mic, MicOff } from 'lucide-react';
import AgentPulse from './components/AgentPulse';
import ReportCard from './components/ReportCard';

const API_BASE = 'http://127.0.0.1:5000/api/v1';

function App() {
  const [symptoms, setSymptoms] = useState('');
  const [ageRange, setAgeRange] = useState('18-35');
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

  const [view, setView] = useState('assessment');
  const [sessionHistory, setSessionHistory] = useState(() => {
     try {
         const saved = window.localStorage.getItem('aethermed_history');
         return saved ? JSON.parse(saved) : [];
     } catch (e) { return []; }
  });
  const [userSettings, setUserSettings] = useState({
      defaultAgeRange: '18-35',
      theme: 'dark'
  });

  // Voice Interaction State
  const [listeningField, setListeningField] = useState(null); // 'symptoms' | 'notes' | null

  const agents = ['Translation', 'Triage', 'Research', 'Advice', 'Referral', 'Response'];

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

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!symptoms.trim()) return;

    setLoading(true);
    setReport(null);
    setError(null);
    setCompletedAgents([]);
    setIsSidebarOpen(false); // Close sidebar on mobile when starting analysis
    
    try {
      const response = await axios.post(`${API_BASE}/analyze`, { 
        symptoms, 
        ageRange, 
        urgency, 
        notes 
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
          report: reportData
      };
      setSessionHistory(prev => {
          const updated = [newHistoryItem, ...prev];
          window.localStorage.setItem('aethermed_history', JSON.stringify(updated));
          return updated;
      });
    } catch (err) {
      setError('Communication with AetherMed Orchestrator failed. Please check the backend connection.');
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
        <div className="logo-compact">
          <div className="logo-icon">A</div>
          <span>AetherMed</span>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`sidebar glass ${isSidebarOpen ? 'open' : ''}`}>
        <div className="logo">
          <div className="logo-icon">A</div>
          <span>AetherMed</span>
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
          <User size={18} /> Demo User
        </div>
      </aside>

      {/* Backdrop for mobile sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
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
          <div className="breadcrumb">Dashboard / Assessment</div>
          <div className="header-actions">
            <Clock size={16} /> <span id="time">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </header>

        <section className="consultation-area">

          {view === 'history' && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="history-view glass" style={{ padding: '32px', width: '100%', maxWidth: '800px', marginTop: '20px', textAlign: 'left' }}>
                <h2>Session History</h2>
                {sessionHistory.length === 0 ? (
                    <p style={{ color: '#94a3b8', marginTop: '16px' }}>No saved assessments yet. Run a scan to build history.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
                        {sessionHistory.map(session => (
                            <div key={session.id} style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                <div style={{ fontSize: '12px', color: '#64748b' }}>{session.date}</div>
                                <div style={{ fontWeight: '500', margin: '12px 0', color: '#f8fafc', fontSize: '15px' }}>"{session.symptoms}"</div>
                                <button className="reset-btn" style={{ padding: '8px 16px', fontSize: '13px' }} onClick={() => { setReport(session.report); setView('assessment'); }}>
                                   Load Assessment View
                                </button>
                            </div>
                        ))}
                    </div>
                )}
             </motion.div>
          )}

          {view === 'settings' && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="settings-view glass" style={{ padding: '32px', width: '100%', maxWidth: '800px', marginTop: '20px', textAlign: 'left' }}>
                <h2>Local Settings</h2>
                <p style={{ color: '#94a3b8', marginTop: '8px' }}>Preferences are saved seamlessly to your browser's local sandbox memory.</p>
                <div className="input-group" style={{ marginTop: '32px', background: 'transparent', boxShadow: 'none' }}>
                    <div className="form-field">
                        <label>Default Visual Theme</label>
                        <select value={userSettings.theme} onChange={(e) => setUserSettings({...userSettings, theme: e.target.value})}>
                            <option value="dark">Cinematic Dark Mode</option>
                            <option value="light">Clinical Light (Coming Soon)</option>
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
             </motion.div>
          )}

          {view === 'assessment' && !report && !loading && (
            <motion.div 
              className="welcome-box"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="title-gradient">System Ready</h1>
              <p>Please describe your symptoms, including duration and intensity.</p>
              
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
                      min="1" max="5" 
                      value={urgency} 
                      onChange={(e) => setUrgency(e.target.value)} 
                    />
                    <div className="urgency-value">Selected: {urgency}</div>
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
                  {loading ? 'Processing...' : <><Send size={18} /> Standardize Assessment</>}
                </button>
              </form>
            </motion.div>
          )}

          {loading && (
            <div className="orchestrator-view glass">
              <div className="view-header">
                <h3>Agentic Workflow</h3>
                <div className="status-badge pulse-active">Live Processing</div>
              </div>
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
                    <motion.div 
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
                    </motion.div>
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
        .layout { display: flex; height: 100vh; width: 100%; position: relative; overflow: hidden; background: #0f172a; }
        
        /* Mobile Navbar */
        .mobile-navbar {
          display: none;
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 64px;
          padding: 0 20px;
          z-index: 100;
          align-items: center;
          justify-content: space-between;
          border-radius: 0;
          border-bottom: 1px solid var(--border-color);
        }

        .menu-toggle { background: transparent; border: 0; color: #fff; cursor: pointer; display: flex; align-items: center; }
        .logo-compact { display: flex; align-items: center; gap: 8px; }
        .logo-compact span { font-weight: 700; font-size: 16px; color: #fff; }

        /* Sidebar Styles */
        .sidebar { 
          width: var(--sidebar-width); 
          height: 100vh; 
          display: flex; 
          flex-direction: column; 
          padding: 24px; 
          border-right: 1px solid var(--border-color);
          z-index: 110;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .sidebar-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          z-index: 105;
          display: none;
        }

        .logo { display: flex; align-items: center; gap: 12px; margin-bottom: 48px; }
        .logo-icon { width: 32px; height: 32px; background: var(--primary); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #fff; }
        .logo span { font-weight: 700; font-size: 18px; color: #f8fafc; }
        
        nav { flex: 1; display: flex; flex-direction: column; gap: 8px; }
        .nav-item { background: transparent; border: 0; color: #94a3b8; padding: 12px 16px; border-radius: 12px; display: flex; align-items: center; gap: 12px; cursor: pointer; transition: all 0.2s; text-align: left; width: 100%; }
        .nav-item:hover { background: rgba(255, 255, 255, 0.05); color: #fff; }
        .nav-item.active { background: var(--primary-glow); color: var(--primary); }
        .user-profile { margin-top: auto; padding-top: 24px; border-top: 1px solid var(--border-color); color: #94a3b8; display: flex; align-items: center; gap: 12px; font-size: 14px; }

        /* Main Content Styles */
        .main-content { 
          flex: 1; 
          display: flex; 
          flex-direction: column; 
          overflow-y: auto; 
          background: radial-gradient(circle at center, #1e293b00, #0f172a); 
          position: relative;
        }

        .main-header { 
          padding: 24px 40px; 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          border-bottom: 1px solid var(--border-color); 
          background: rgba(15, 23, 42, 0.3);
          backdrop-filter: blur(8px);
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .breadcrumb { font-size: 12px; color: #64748b; font-weight: 500; text-transform: uppercase; letter-spacing: 1px; }
        .header-actions { color: #64748b; font-size: 13px; display: flex; align-items: center; gap: 8px; }

        .consultation-area { 
          flex: 1; 
          padding: 60px 40px; 
          display: flex; 
          flex-direction: column; 
          align-items: center; 
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
        }

        .welcome-box { max-width: 600px; width: 100%; text-align: center; margin-top: 40px; }
        h1 { font-size: clamp(2rem, 5vw, 3rem); margin-bottom: 16px; font-weight: 800; letter-spacing: -1px; }
        p { color: #94a3b8; font-size: clamp(1rem, 2vw, 1.125rem); margin-bottom: 40px; }

        .input-group { padding: clamp(20px, 5vw, 32px); width: 100%; display: flex; flex-direction: column; gap: 20px; box-shadow: 0 20px 50px rgba(0,0,0,0.3); text-align: left;}
        
        .form-row { display: flex; gap: 20px; }
        .form-field { display: flex; flex-direction: column; gap: 8px; flex: 1; }
        .form-field label { font-size: 13px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
        
        select, input[type="range"] { background: rgba(15, 23, 42, 0.5); border: 1px solid var(--border-color); border-radius: 8px; padding: 12px; color: #fff; width: 100%; }
        select:focus, input[type="range"]:focus { outline: none; border-color: var(--primary); }
        .urgency-value { font-size: 12px; color: var(--primary); text-align: right; margin-top: 4px; font-weight: bold; }

        textarea { background: rgba(15, 23, 42, 0.5); border: 1px solid var(--border-color); border-radius: 12px; padding: 16px; color: #fff; font-size: 15px; resize: none; width: 100%; }
        textarea:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 2px var(--primary-glow); }
        
        .mic-btn { background: transparent; border: 1px solid var(--border-color); color: #94a3b8; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; }
        .mic-btn:hover { background: rgba(15, 23, 42, 0.8); color: #fff; }
        .mic-btn.recording { background: rgba(239, 68, 68, 0.2); color: #ef4444; border-color: #ef4444; animation: pulse-record 1.5s infinite; }
        
        @keyframes pulse-record {
            0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
            70% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
            100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }

        button[type="submit"] { background: var(--primary); color: #fff; border: 0; padding: 16px; border-radius: 12px; font-weight: 700; font-size: 16px; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; justify-content: center; gap: 10px; margin-top: 10px; }
        button[type="submit"]:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(14, 165, 233, 0.3); }

        @media (max-width: 600px) {
            .form-row { flex-direction: column; gap: 16px; }
        }

        .orchestrator-view { max-width: 500px; width: 100%; padding: clamp(20px, 5vw, 32px); border-top: 2px solid var(--primary); margin-top: 20px; }
        .view-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; gap: 12px; }
        .view-header h3 { margin: 0; font-size: 14px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
        .agent-stack { display: flex; flex-direction: column; gap: 12px; }

        .results-container { width: 100%; display: flex; flex-direction: column; align-items: center; padding-bottom: 40px; }
        .reset-btn { margin-top: 24px; background: transparent; border: 1px solid var(--border-color); color: #94a3b8; padding: 10px 20px; border-radius: 10px; display: flex; align-items: center; gap: 8px; cursor: pointer; }

        /* Media Queries */
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
            width: 80%;
            max-width: 300px;
          }
          .sidebar.open { transform: translateX(0); }
          .sidebar-backdrop { display: block; }
          .main-content { padding-top: 64px; }
          .consultation-area { padding: 40px 20px; }
          h1 { margin-top: 0; }
          .welcome-box { margin-top: 0; }
        }

        @media (max-width: 480px) {
          .orchestrator-view { padding: 20px; }
          .input-group { padding: 16px; }
          .nav-item { padding: 10px; font-size: 14px; }
        }
      `}</style>
    </div>
  );
}

export default App;
