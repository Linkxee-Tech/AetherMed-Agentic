import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Search, ShieldCheck, MapPin, FileText, Globe } from 'lucide-react';

const icons = {
  Translation: Globe,
  Triage: Activity,
  Research: Search,
  Advice: ShieldCheck,
  Referral: MapPin,
  Response: FileText
};

const colors = {
  Translation: '#ec4899', // pink
  Triage: '#ef4444', // Red
  Research: '#0ea5e9', // Blue
  Advice: '#10b981', // green
  Referral: '#8b5cf6', // Violet
  Response: '#f59e0b' // amber
};

const AgentPulse = ({ name, active, complete }) => {
  const Icon = icons[name] || FileText;
  const color = colors[name] || '#f59e0b';

  return (
    <div className={`agent-status-item ${active ? 'active' : ''} ${complete ? 'complete' : ''}`}>
      <div 
        className="icon-container" 
        style={{ 
          borderColor: active ? color : 'var(--border-color)',
          boxShadow: active ? `0 0 20px ${color}44` : 'none'
        }}
      >
        <Icon size={24} color={active || complete ? color : '#94a3b8'} />
        {active && (
          <motion.div 
            className="pulse-ring"
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{ backgroundColor: color }}
          />
        )}
      </div>
      <div className="agent-label">
        <span style={{ color: active || complete ? '#fff' : '#64748b' }}>{name}</span>
        {active && <span className="thinking-text">Thinking...</span>}
      </div>

      <style>{`
        .agent-status-item {
          display: flex;
          align-items: center;
          gap: clamp(8px, 2vw, 12px);
          opacity: 0.6;
          transition: all 0.3s ease;
          padding: 8px;
        }
        .active { opacity: 1; transform: translateX(clamp(4px, 1vw, 8px)); }
        .complete { opacity: 1; }
        
        .icon-container {
          position: relative;
          width: clamp(40px, 10vw, 48px);
          height: clamp(40px, 10vw, 48px);
          border-radius: 12px;
          background: rgba(30, 41, 59, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid transparent;
          transition: all 0.5s ease;
          flex-shrink: 0;
        }

        .pulse-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 12px;
          z-index: -1;
        }

        .agent-label {
          display: flex;
          flex-direction: column;
        }

        .agent-label span { font-weight: 600; font-size: clamp(12px, 3vw, 14px); line-height: 1.2; }
        .thinking-text { font-size: 10px; color: var(--primary); margin-top: 2px; }

        @media (max-width: 480px) {
          .agent-status-item { padding: 4px; }
        }
      `}</style>
    </div>
  );
};

export default AgentPulse;
