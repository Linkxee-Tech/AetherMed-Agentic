import React from 'react';
import { motion as motionLib } from 'framer-motion';
import { Eye, Info, CheckCircle, AlertCircle, ArrowRightCircle, Languages } from 'lucide-react';
import MultimodalSummaryCard from './MultimodalSummaryCard';
import RiskBadge from './RiskBadge';
import SafetyBanner from './SafetyBanner';
import { formatDetectedLanguage, getRiskTheme } from '../lib/clinicalPresentation';

const MotionDiv = motionLib.div;

const FALLBACK_OBSERVATION = 'No clear visual observations were returned.';
const FALLBACK_CONCERN = 'No broad concerns were listed.';
const FALLBACK_STEP = 'No specific next steps were returned.';
const FALLBACK_URGENT = 'No urgent warning signs were listed.';

function renderList(items, fallback) {
  const values = Array.isArray(items) && items.length ? items : [fallback];

  return values.map((item, index) => (
    <li key={`${item}-${index}`}>{item}</li>
  ));
}

const qualityLabels = {
  clear: 'Image clear enough to review',
  unclear: 'Image unclear',
  incomplete: 'Image incomplete'
};

const VisualReportCard = ({ data }) => {
  if (!data) return null;

  const safetyLevel = data.multimodalSummary?.riskLevel || data.safetyLevel || 'Moderate';
  const riskTheme = getRiskTheme(safetyLevel);
  const currentColor = riskTheme.accent;
  const imageQuality = data.imageQuality || 'unclear';
  const qualityLabel = qualityLabels[imageQuality] || qualityLabels.unclear;
  const isMedicalImaging = data.reviewMode === 'medical_imaging';
  const detectedLanguage = formatDetectedLanguage(data.detectedLanguage || data.multimodalSummary?.detectedLanguage);

  return (
    <MotionDiv
      className="visual-report-card glass"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="report-header">
        <div className="badge-row">
          <RiskBadge level={safetyLevel} suffix="risk" />
          <div className="quality-badge">{isMedicalImaging ? 'Medical imaging upload' : 'Visible symptom photo'}</div>
          <div className="quality-badge">{qualityLabel}</div>
          <div className="quality-badge"><Languages size={14} /> {detectedLanguage}</div>
        </div>
        <h2>{isMedicalImaging ? 'Medical imaging safe response' : 'Visual symptom assistant'}</h2>
        <p className="timestamp">Generated {new Date().toLocaleString()}</p>
      </div>

      <MultimodalSummaryCard summary={data.multimodalSummary} />

      <div className="summary-panel" style={{ borderColor: `${currentColor}55` }}>
        <span className="summary-kicker">{isMedicalImaging ? 'Final safe response' : 'Final short response'}</span>
        <h3>{(isMedicalImaging ? data.finalSafeResponse : data.finalShortResponse) || 'Please use the details below as a cautious visual review only.'}</h3>
        <p>{isMedicalImaging ? 'This response acknowledges the uploaded medical imaging but does not diagnose or replace professional review.' : 'This review is limited to visible features in the uploaded image and does not provide a diagnosis.'}</p>
      </div>

      <div className="visual-overview-grid">
        <div className="overview-card">
          <span className="summary-kicker">Review scope</span>
          <strong>{isMedicalImaging ? 'Safety-limited imaging acknowledgment' : 'Visible external symptom review'}</strong>
          <span>{isMedicalImaging ? 'The system explains what can and cannot be said safely from a scan image.' : 'The system focuses only on what is visibly present in the uploaded photo.'}</span>
        </div>
        <div className="overview-card">
          <span className="summary-kicker">Risk level</span>
          <strong style={{ color: currentColor }}>{riskTheme.label} risk</strong>
          <span>Visual findings are translated into cautious safety guidance and escalation cues.</span>
        </div>
        <div className="overview-card">
          <span className="summary-kicker">Detected language</span>
          <strong>{detectedLanguage}</strong>
          <span>Language context is surfaced so the response feels purpose-built for multilingual triage.</span>
        </div>
      </div>

      {isMedicalImaging ? (
        <div className="section-grid">
          <section className="report-section">
            <h3><Eye size={18} /> 1. Acknowledgment</h3>
            <p>{data.acknowledgment || 'I can see that you uploaded a medical imaging image.'}</p>
          </section>

          <section className="report-section">
            <h3><Info size={18} /> 2. What can be said safely</h3>
            <p>{data.whatCanBeSaidSafely || data.visualObservations?.[0] || 'Only broad visible patterns can be mentioned safely without trying to diagnose the image.'}</p>
          </section>

          <section className="report-section">
            <h3><AlertCircle size={18} /> 3. What cannot be confirmed</h3>
            <p>{data.whatCannotBeConfirmed || 'A medical diagnosis cannot be confirmed from the image alone here.'}</p>
          </section>

          <section className="report-section">
            <h3><ArrowRightCircle size={18} /> 4. Recommended next step</h3>
            <p>{data.recommendedNextStepSummary || data.recommendedNextSteps?.[0] || 'Please have the image reviewed by a qualified healthcare professional.'}</p>
          </section>

          <section className="report-section full-width">
            <h3><AlertCircle size={18} /> 5. Final safe response</h3>
            <p>{data.finalSafeResponse || 'I cannot diagnose medical imaging here, so the safest next step is professional review.'}</p>
          </section>
        </div>
      ) : (
        <div className="section-grid">
          <section className="report-section">
            <h3><Eye size={18} /> 1. Visual observations</h3>
            <ul>{renderList(data.visualObservations, FALLBACK_OBSERVATION)}</ul>
          </section>

          <section className="report-section">
            <h3><Info size={18} /> 2. Possible general concerns</h3>
            <ul>{renderList(data.possibleGeneralConcerns, FALLBACK_CONCERN)}</ul>
          </section>

          <section className="report-section">
            <h3><AlertCircle size={18} /> 3. Safety level</h3>
            <div className="safety-panel" style={{ borderColor: `${currentColor}55` }}>
              <strong style={{ color: currentColor }}>{riskTheme.label}</strong>
              <span>{qualityLabel}</span>
            </div>
          </section>

          <section className="report-section">
            <h3><CheckCircle size={18} /> 4. Recommended next steps</h3>
            <ul>{renderList(data.recommendedNextSteps, FALLBACK_STEP)}</ul>
          </section>

          <section className="report-section full-width">
            <h3><AlertCircle size={18} /> 5. When to seek medical help immediately</h3>
            <ul>{renderList(data.whenToSeekMedicalHelpImmediately, FALLBACK_URGENT)}</ul>
          </section>

          <section className="report-section full-width">
            <h3><Info size={18} /> 6. Final short response to the user</h3>
            <p>{data.finalShortResponse || 'Please arrange medical review if the visible issue looks serious, is worsening, or the image is unclear.'}</p>
          </section>
        </div>
      )}

      <SafetyBanner
        compact
        tone={riskTheme.key === 'EMERGENCY' ? 'urgent' : 'warning'}
        title="AetherMed does not diagnose from images"
        message={isMedicalImaging ? 'This is a safety-limited response to an uploaded medical imaging file for demonstration purposes only. It does not replace a radiologist, doctor, formal report, or emergency care.' : 'This is a visual review of an uploaded image for demonstration purposes only. It does not replace professional medical care or emergency services.'}
      />

      <style>{`
        .visual-report-card {
          padding: clamp(20px, 5vw, 32px);
          margin-top: 12px;
          max-width: 960px;
          width: 100%;
          border-top: 4px solid ${currentColor};
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

        .quality-badge {
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

        .quality-badge {
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

        .visual-overview-grid {
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

        .safety-panel {
          display: flex;
          flex-direction: column;
          gap: 8px;
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 16px;
          background: var(--surface-strong);
        }

        .safety-panel strong {
          font-size: 1.2rem;
        }

        .safety-panel span {
          color: var(--text-secondary);
          line-height: 1.6;
        }

        @media (max-width: 900px) {
          .visual-overview-grid,
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

export default VisualReportCard;
