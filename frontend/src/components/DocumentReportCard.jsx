import React from 'react';
import { motion as motionLib } from 'framer-motion';
import { FileText, Search, Info, AlertCircle, ArrowRightCircle, Languages } from 'lucide-react';
import MultimodalSummaryCard from './MultimodalSummaryCard';
import RiskBadge from './RiskBadge';
import SafetyBanner from './SafetyBanner';
import { formatDetectedLanguage, getRiskTheme } from '../lib/clinicalPresentation';

const MotionDiv = motionLib.div;

function renderList(items, fallback) {
  const values = Array.isArray(items) && items.length ? items : [fallback];

  return values.map((item, index) => (
    <li key={`${item}-${index}`}>{item}</li>
  ));
}

const readabilityLabels = {
  clear: 'Readable',
  partial: 'Partially readable',
  unclear: 'Unclear'
};

const readabilityColors = {
  clear: '#34d399',
  partial: '#facc15',
  unclear: '#f87171'
};

const DocumentReportCard = ({ data }) => {
  if (!data) return null;

  const readability = data.readability || 'partial';
  const readabilityLabel = readabilityLabels[readability] || readabilityLabels.partial;
  const fallbackRisk = Array.isArray(data.importantWarningSigns) && data.importantWarningSigns.length > 0 ? 'High' : 'Moderate';
  const riskTheme = getRiskTheme(data.multimodalSummary?.riskLevel || fallbackRisk);
  const currentColor = readabilityColors[readability] || readabilityColors.partial;
  const hasWarnings = Array.isArray(data.importantWarningSigns) && data.importantWarningSigns.length > 0;
  const detectedLanguage = formatDetectedLanguage(data.detectedLanguage || data.multimodalSummary?.detectedLanguage);

  return (
    <MotionDiv
      className="document-report-card glass"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="report-header">
        <div className="badge-row">
          <RiskBadge level={riskTheme.key} />
          <div className="type-badge">{data.documentType || 'Medical document'}</div>
          <div className="readability-badge" style={{ backgroundColor: `${currentColor}1f`, color: currentColor }}>
            {readabilityLabel}
          </div>
          <div className="meta-badge"><Languages size={14} /> {detectedLanguage}</div>
        </div>
        <h2>Medical document explanation</h2>
        <p className="timestamp">Generated {new Date().toLocaleString()}</p>
      </div>

      <MultimodalSummaryCard summary={data.multimodalSummary} />

      <div className="summary-panel" style={{ borderColor: `${currentColor}55` }}>
        <span className="summary-kicker">Final user-friendly explanation</span>
        <h3>{data.finalExplanation || 'Use the sections below as a plain-language explanation of the uploaded medical document.'}</h3>
        <p>This explanation keeps the original document as the source of truth and does not replace your doctor, clinic, or pharmacist.</p>
      </div>

      <div className="document-overview-grid">
        <div className="overview-card">
          <span className="summary-kicker">Document type</span>
          <strong>{data.documentType || 'Medical document'}</strong>
          <span>The system preserves the source material while simplifying its meaning.</span>
        </div>
        <div className="overview-card">
          <span className="summary-kicker">Risk emphasis</span>
          <strong style={{ color: riskTheme.accent }}>{riskTheme.label} risk</strong>
          <span>Warnings and follow-up instructions are surfaced in a separate section for safer review.</span>
        </div>
        <div className="overview-card">
          <span className="summary-kicker">Detected language</span>
          <strong>{detectedLanguage}</strong>
          <span>Language context is visible so multilingual intake feels deliberate and clinical.</span>
        </div>
      </div>

      <div className="section-grid">
        <section className="report-section">
          <h3><FileText size={18} /> 1. Document summary</h3>
          <p>{data.documentSummary || 'No summary was returned.'}</p>
        </section>

        <section className="report-section">
          <h3><Search size={18} /> 2. Key findings</h3>
          <ul>{renderList(data.keyFindings, 'No key findings were listed.')}</ul>
        </section>

        <section className="report-section">
          <h3><Info size={18} /> 3. What it may mean in simple terms</h3>
          <ul>{renderList(data.simpleMeaning, 'No plain-language explanation was listed.')}</ul>
        </section>

        <section className="report-section">
          <h3><AlertCircle size={18} /> 4. Important warning signs, if any</h3>
          <div className={`warning-panel ${hasWarnings ? 'has-warnings' : ''}`}>
            <ul>{renderList(data.importantWarningSigns, 'No urgent warning signs were highlighted from the document.')}</ul>
          </div>
        </section>

        <section className="report-section full-width">
          <h3><ArrowRightCircle size={18} /> 5. Suggested next step</h3>
          <p>{data.suggestedNextStep || 'Review the original document and follow up with the issuing clinician if anything is unclear.'}</p>
        </section>

        <section className="report-section full-width">
          <h3><Info size={18} /> 6. Final user-friendly explanation</h3>
          <p>{data.finalExplanation || 'Please use this as a plain-language guide alongside the original medical document.'}</p>
        </section>
      </div>

      <SafetyBanner
        compact
        tone={riskTheme.key === 'EMERGENCY' ? 'urgent' : 'warning'}
        title="AetherMed explains documents, not diagnoses"
        message="This is a medical document explanation tool for demonstration purposes only. It does not replace the original report, professional medical advice, or emergency care."
      />

      <style>{`
        .document-report-card {
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

        .type-badge,
        .readability-badge,
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
        }

        .type-badge,
        .meta-badge {
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

        .document-overview-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 22px;
        }

        .overview-card {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 16px;
          border-radius: 18px;
          border: 1px solid var(--border-color);
          background: var(--surface-muted);
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
          gap: 22px;
        }

        .report-section {
          background: var(--surface-muted);
          border: 1px solid var(--border-color);
          border-radius: 18px;
          padding: 18px;
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

        .report-section ul {
          margin: 0;
          padding-left: 18px;
          color: var(--text-secondary);
        }

        .report-section li,
        .report-section p {
          color: var(--text-secondary);
          line-height: 1.7;
          margin: 0 0 10px;
        }

        .report-section li:last-child,
        .report-section p:last-child {
          margin-bottom: 0;
        }

        .warning-panel {
          border-radius: 16px;
          background: var(--surface-strong);
          border: 1px solid var(--border-color);
          padding: 16px;
        }

        .warning-panel.has-warnings {
          border-color: color-mix(in srgb, var(--danger) 35%, var(--border-color));
          background: color-mix(in srgb, var(--danger-soft) 70%, var(--surface-strong));
        }

        @media (max-width: 900px) {
          .document-overview-grid,
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

export default DocumentReportCard;
