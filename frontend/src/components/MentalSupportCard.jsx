import React from 'react';
import { motion as motionLib } from 'framer-motion';
import { AlertCircle, ArrowRightCircle, HeartHandshake, Languages, MessageSquareHeart, Sparkles } from 'lucide-react';
import MultimodalSummaryCard from './MultimodalSummaryCard';
import RiskBadge from './RiskBadge';
import SafetyBanner from './SafetyBanner';
import { formatDetectedLanguage, getRiskTheme } from '../lib/clinicalPresentation';

const MotionDiv = motionLib.div;

function renderList(items, fallback) {
  const values = Array.isArray(items) && items.length ? items : [fallback];
  return values.map((item, index) => <li key={`${item}-${index}`}>{item}</li>);
}

const MentalSupportCard = ({ data }) => {
  if (!data) return null;

  const riskTheme = getRiskTheme(data.riskLevel || data.multimodalSummary?.riskLevel || 'Moderate');
  const detectedLanguage = formatDetectedLanguage(data.detectedLanguage || data.multimodalSummary?.detectedLanguage);

  return (
    <MotionDiv
      className="mental-support-card glass"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="report-header">
        <div className="badge-row">
          <RiskBadge level={riskTheme.key} />
          <div className="meta-badge"><HeartHandshake size={14} /> Emotional safety</div>
          <div className="meta-badge"><Languages size={14} /> {detectedLanguage}</div>
        </div>
        <h2>Mental support session</h2>
        <p className="timestamp">Updated {new Date().toLocaleString()}</p>
      </div>

      <MultimodalSummaryCard summary={data.multimodalSummary} />

      <div className="summary-panel" style={{ borderColor: `${riskTheme.accent}55` }}>
        <span className="summary-kicker">Support focus</span>
        <h3>{data.supportFocus || 'Emotional safety support'}</h3>
        <p>{data.validation || data.supportiveResponse || 'This session is focused on helping the user feel safer, more grounded, and connected to the next real-world step.'}</p>
      </div>

      <div className="overview-grid">
        <div className="overview-card">
          <span className="summary-kicker">Emotional state</span>
          <strong>{data.emotionalState || 'Emotional strain'}</strong>
          <span>The session tracks the most immediate emotional need so the support stays practical and grounded.</span>
        </div>
        <div className="overview-card">
          <span className="summary-kicker">Risk level</span>
          <strong style={{ color: riskTheme.accent }}>{riskTheme.label} risk</strong>
          <span>Higher risk triggers clearer escalation toward immediate human support and safety planning.</span>
        </div>
        <div className="overview-card">
          <span className="summary-kicker">Follow-up focus</span>
          <strong>{data.followUpSuggestion || 'Continue the conversation and take one safe next step.'}</strong>
          <span>The session should move toward grounding, real-world support, and reduced isolation.</span>
        </div>
      </div>

      <div className="section-grid">
        <section className="report-section full-width">
          <h3><MessageSquareHeart size={18} /> 1. Main support response</h3>
          <p>{data.supportiveResponse || 'A supportive response was not available.'}</p>
        </section>

        <section className="report-section">
          <h3><Sparkles size={18} /> 2. Grounding steps</h3>
          <ul>{renderList(data.groundingSteps, 'Take one slow breath out and focus on what is physically around you right now.')}</ul>
        </section>

        <section className="report-section">
          <h3><ArrowRightCircle size={18} /> 3. Coping steps</h3>
          <ul>{renderList(data.copingSteps, 'Take one small next step and reach out to a trusted person if needed.')}</ul>
        </section>

        <section className="report-section">
          <h3><HeartHandshake size={18} /> 4. Session guidance</h3>
          <ul>{renderList(data.sessionGuidance, 'Keep talking through what feels hardest right now.')}</ul>
        </section>

        <section className="report-section">
          <h3><AlertCircle size={18} /> 5. When to seek immediate help</h3>
          <ul>{renderList(data.whenToSeekImmediateHelp, 'Seek urgent help if you do not feel able to stay safe.')}</ul>
        </section>
      </div>

      <SafetyBanner
        compact
        tone={data.needsUrgentEscalation ? 'urgent' : 'warning'}
        title="AetherMed provides emotional support, not emergency crisis care"
        message={data.needsUrgentEscalation
          ? 'The current session suggests immediate human support is needed. Move toward another person, reduce access to anything you could use to hurt yourself, and contact emergency or crisis support now.'
          : 'Use this as supportive guidance and grounding help. If safety becomes uncertain or distress sharply worsens, contact a trusted person, clinician, or emergency support right away.'}
      />

      <style>{`
        .mental-support-card {
          padding: clamp(20px, 5vw, 32px);
          margin-top: 12px;
          max-width: 960px;
          width: 100%;
          border-top: 4px solid ${riskTheme.accent};
        }

        .report-header {
          margin-bottom: 22px;
          padding-bottom: 18px;
          border-bottom: 1px solid var(--border-color);
        }

        .badge-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 14px;
        }

        .meta-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 32px;
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          background: var(--surface-muted);
        }

        h2 {
          margin: 0;
          font-size: clamp(1.4rem, 4vw, 1.8rem);
          color: var(--text-primary);
          line-height: 1.2;
        }

        .timestamp {
          font-size: 12px;
          color: var(--text-muted);
          margin: 8px 0 0;
        }

        .summary-panel {
          margin-bottom: 24px;
          border: 1px solid var(--border-color);
          border-radius: 22px;
          padding: 18px;
          background: linear-gradient(160deg, var(--surface-soft), transparent);
        }

        .summary-kicker {
          display: inline-block;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 700;
          color: var(--text-muted);
          margin-bottom: 10px;
        }

        .summary-panel h3 {
          margin: 0 0 10px;
          font-size: clamp(1.2rem, 2vw, 1.5rem);
          color: var(--text-primary);
          line-height: 1.3;
        }

        .summary-panel p {
          margin: 0;
          color: var(--text-secondary);
          line-height: 1.7;
        }

        .overview-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 22px;
        }

        .overview-card,
        .report-section {
          padding: 16px;
          border-radius: 18px;
          border: 1px solid var(--border-color);
          background: var(--surface-muted);
        }

        .overview-card {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .overview-card strong {
          color: var(--text-primary);
          line-height: 1.45;
        }

        .overview-card span:last-child {
          color: var(--text-secondary);
          line-height: 1.6;
          font-size: 13px;
        }

        .section-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 22px;
        }

        .report-section.full-width {
          grid-column: 1 / -1;
        }

        .report-section h3 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 14px;
          font-size: 15px;
          color: var(--primary);
        }

        .report-section p,
        .report-section li {
          color: var(--text-secondary);
          line-height: 1.7;
        }

        .report-section p {
          margin: 0;
        }

        .report-section ul {
          margin: 0;
          padding-left: 18px;
        }

        .report-section li {
          margin-bottom: 10px;
        }

        .report-section li:last-child {
          margin-bottom: 0;
        }

        @media (max-width: 900px) {
          .overview-grid,
          .section-grid {
            grid-template-columns: 1fr;
          }

          .report-section.full-width {
            grid-column: auto;
          }
        }
      `}</style>
    </MotionDiv>
  );
};

export default MentalSupportCard;
