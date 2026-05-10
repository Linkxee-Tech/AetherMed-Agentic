import React from 'react';
import { motion as motionLib } from 'framer-motion';
import { AlertCircle, ArrowRightCircle, BadgeCheck, Pill, ScanSearch, Shield, Languages } from 'lucide-react';
import MultimodalSummaryCard from './MultimodalSummaryCard';
import RiskBadge from './RiskBadge';
import SafetyBanner from './SafetyBanner';
import { formatDetectedLanguage, getRiskTheme } from '../lib/clinicalPresentation';

const MotionDiv = motionLib.div;

function renderList(items, fallback) {
  const values = Array.isArray(items) && items.length ? items : [fallback];
  return values.map((item, index) => <li key={`${item}-${index}`}>{item}</li>);
}

const DrugCheckerCard = ({ data }) => {
  if (!data) return null;

  const riskTheme = getRiskTheme(data.riskLevel || data.multimodalSummary?.riskLevel || 'Moderate');
  const detectedLanguage = formatDetectedLanguage(data.detectedLanguage || data.multimodalSummary?.detectedLanguage);

  return (
    <MotionDiv
      className="drug-checker-card glass"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="report-header">
        <div className="badge-row">
          <RiskBadge level={riskTheme.key} />
          <div className="meta-badge"><Pill size={14} /> Drug safety</div>
          <div className="meta-badge"><Languages size={14} /> {detectedLanguage}</div>
        </div>
        <h2>Drug checker</h2>
        <p className="timestamp">Generated {new Date().toLocaleString()}</p>
      </div>

      <MultimodalSummaryCard summary={data.multimodalSummary} />

      <div className="summary-panel" style={{ borderColor: `${riskTheme.accent}55` }}>
        <span className="summary-kicker">Counterfeit-risk status</span>
        <h3>{data.authenticityStatus || 'Verification still needed before use'}</h3>
        <p>{data.finalAdvice || 'Use this review only as a counterfeit-risk screen and verify the medicine with a pharmacist or trusted licensed source.'}</p>
      </div>

      <div className="overview-grid">
        <div className="overview-card">
          <span className="summary-kicker">Product summary</span>
          <strong>{data.productSummary || 'Medicine review completed.'}</strong>
          <span>This is a practical authenticity-risk screen, not a formal lab or regulator authentication.</span>
        </div>
        <div className="overview-card">
          <span className="summary-kicker">Barcode context</span>
          <strong>{data.barcodeValue || 'No barcode provided'}</strong>
          <span>{data.barcodeValue ? 'Use the barcode only as supporting verification context alongside packaging checks and pharmacist review.' : 'You can still verify the medicine using the pack details, seal, batch number, expiry, and seller source.'}</span>
        </div>
        <div className="overview-card">
          <span className="summary-kicker">Risk level</span>
          <strong style={{ color: riskTheme.accent }}>{riskTheme.label} risk</strong>
          <span>Higher risk means the safest next step is to avoid use until verified by a licensed professional.</span>
        </div>
        <div className="overview-card">
          <span className="summary-kicker">Use recommendation</span>
          <strong>{data.shouldAvoidUse ? 'Avoid use until verified' : 'Verify before relying on it'}</strong>
          <span>Packaging details, seller source, and professional verification matter more than appearance alone.</span>
        </div>
      </div>

      <div className="section-grid">
        <section className="report-section">
          <h3><AlertCircle size={18} /> 1. Risk indicators</h3>
          <ul>{renderList(data.riskIndicators, 'No specific risk indicators were returned, but verification is still recommended.')}</ul>
        </section>

        <section className="report-section">
          <h3><BadgeCheck size={18} /> 2. Safe checks</h3>
          <ul>{renderList(data.safeChecks, 'Check the seller, seal, batch details, and expiry date with a licensed source.')}</ul>
        </section>

        <section className="report-section">
          <h3><ArrowRightCircle size={18} /> 3. What to do next</h3>
          <ul>{renderList(data.whatToDoNext, 'Ask a pharmacist or licensed source to verify the product before use.')}</ul>
        </section>

        <section className="report-section">
          <h3><ScanSearch size={18} /> 4. Urgent warnings</h3>
          <ul>{renderList(data.urgentWarnings, 'Seek urgent help if the medicine was taken and a severe reaction develops.')}</ul>
        </section>
      </div>

      <SafetyBanner
        compact
        tone={data.shouldAvoidUse ? 'urgent' : 'warning'}
        title="AetherMed does not certify medicines as genuine"
        message="This feature screens for counterfeit-risk warning signs and safer verification steps. A pharmacist, hospital, licensed seller, or official regulator process is still needed for real confirmation."
      />

      <style>{`
        .drug-checker-card {
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
          line-height: 1.65;
        }

        .overview-grid,
        .section-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
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

        .overview-card span:last-child,
        .report-section li {
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .report-section h3 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 14px;
          font-size: 15px;
          color: var(--primary);
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
        }
      `}</style>
    </MotionDiv>
  );
};

export default DrugCheckerCard;
