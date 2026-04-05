import React, { useState } from 'react';
import { motion as motionLib, AnimatePresence } from 'framer-motion';
import { CheckCircle, Info, Code, ChevronDown, ChevronUp, ShieldAlert, Pill } from 'lucide-react';

const MotionDiv = motionLib.div;

function getAgeRange(bundle) {
  const ageExtension = bundle?.extension?.find((item) => item.url === 'urn:aethermed:age-range');
  return ageExtension?.valueString || 'unknown';
}

function isPediatricAge(ageRange) {
  return typeof ageRange === 'string' && ageRange.includes('0-18');
}

function parseInstruction(description) {
  if (typeof description !== 'string') {
    return { urgency: 'MEDIUM', title: 'Recommended step', action: 'Review this guidance with a clinician if needed.' };
  }

  const [urgencyPart, remainder = description] = description.includes(': ')
    ? description.split(': ')
    : ['MEDIUM', description];
  const [titlePart, actionPart = remainder] = remainder.includes(' - ')
    ? remainder.split(' - ')
    : ['Recommended step', remainder];

  return {
    urgency: urgencyPart.toUpperCase(),
    title: titlePart,
    action: actionPart
  };
}

const ReportCard = ({ data }) => {
  const [showRaw, setShowRaw] = useState(false);
  if (!data || !data.entry) return null;

  const bundle = data;
  const detectedLanguage = bundle.detectedLanguage;
  const presentation = bundle.presentation || null;
  const ageRange = getAgeRange(bundle);
  const pediatric = isPediatricAge(ageRange);

  let observations = [];
  let clinicalFindings = 'No findings available.';
  let clinicalScore = 0;
  let urgencyLevel = 'UNKNOWN';
  let instructions = [];
  let medicationSuggestions = [];
  let referral = null;

  bundle.entry.forEach((item) => {
    const res = item.resource;
    if (res.resourceType === 'Observation') {
      observations.push(res.valueString);
    } else if (res.resourceType === 'ClinicalImpression') {
      clinicalFindings = res.summary;
      if (res.protocol?.[0]) {
        urgencyLevel = res.protocol[0];
      }
      const itemObj = res.investigation?.[0]?.item?.[0] || {};
      const scoreMatch = itemObj.display?.match(/Calculated Score:\s*(\d+)/i);
      if (scoreMatch) clinicalScore = parseInt(scoreMatch[1], 10);
    } else if (res.resourceType === 'CarePlan') {
      res.activity?.forEach((act) => {
        if (act.detail.kind === 'ServiceRequest') {
          instructions.push(parseInstruction(act.detail.description));
        } else if (act.detail.kind === 'Appointment') {
          const parts = act.detail.description.match(/Referral to (.*?) at (.*?)\. Action: (.*)/);
          if (parts) {
            referral = { type: parts[1], location: parts[2], action: parts[3] };
          } else {
            referral = { type: 'Referral', location: act.detail.description, action: 'Review the care path details above.' };
          }
        }
      });
    } else if (res.resourceType === 'MedicationRequest') {
      medicationSuggestions.push({
        name: res.medicationCodeableConcept?.text || 'Medication guidance',
        type: res.category?.[0]?.text || 'OTC',
        instructions: res.dosageInstruction?.[0]?.text || 'Use only as directed.',
        cautions: res.note?.[0]?.text || 'Check with a pharmacist or doctor if unsure.'
      });
    }
  });

  const severityToRiskCode = {
    CRITICAL: 'EMERGENCY',
    HIGH: 'HIGH',
    MEDIUM: 'MODERATE',
    LOW: 'LOW',
    STABLE: 'LOW',
    UNKNOWN: 'MODERATE'
  };
  const riskColors = {
    EMERGENCY: '#dc2626',
    HIGH: '#ef4444',
    MODERATE: '#eab308',
    LOW: '#86efac'
  };
  const riskCode = presentation?.riskLevelCode || severityToRiskCode[urgencyLevel] || 'MODERATE';
  const riskLabel = presentation?.riskLevel || ({
    EMERGENCY: 'Emergency',
    HIGH: 'High',
    MODERATE: 'Moderate',
    LOW: 'Low'
  }[riskCode]);
  const currentColor = riskColors[riskCode] || '#64748b';
  const concernLabel = observations.some((item) => typeof item === 'string' && item.toLowerCase().includes('request'))
    ? 'Reported concern'
    : 'Observed symptoms';
  const primaryAction = referral?.action || instructions[0]?.action || 'Review the assessment details and escalate if symptoms worsen.';
  const mainConcernSummary = presentation?.mainConcernSummary || clinicalFindings;
  const safeGuidance = Array.isArray(presentation?.safeGuidance) && presentation.safeGuidance.length
    ? presentation.safeGuidance
    : instructions.map((instruction) => `${instruction.title}: ${instruction.action}`);
  const referralAdvice = presentation?.referralAdvice || (referral ? `${referral.type}: ${referral.action}` : 'Review the assessment details and arrange follow-up based on symptom severity.');
  const finalUserResponse = presentation?.finalUserResponse || primaryAction;
  const displayedLanguage = presentation?.detectedLanguage || detectedLanguage || 'English';

  return (
    <MotionDiv
      className="report-card glass"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div className="report-header">
        <div className="badge-row">
          <div className="urgency-badge" style={{ backgroundColor: `${currentColor}1f`, color: currentColor }}>
            {riskLabel} risk
          </div>
          <div className="score-badge">Risk score: {clinicalScore}</div>
          <div className="language-badge">Language: {displayedLanguage}</div>
        </div>
        <h2>AetherMed assessment summary</h2>
        <p className="timestamp">Generated {new Date().toLocaleString()}</p>
      </div>

      <div className="summary-hero" style={{ borderColor: `${currentColor}55` }}>
        <div className="summary-lead">
          <span className="summary-kicker">Final user response</span>
          <h3>{finalUserResponse}</h3>
          <p>
            {pediatric
              ? (riskCode === 'EMERGENCY'
                  ? 'A child with this pattern needs immediate in-person care. Do not wait to see if things settle on their own.'
                  : riskCode === 'HIGH'
                    ? 'A child with this pattern should be reviewed promptly in person today, especially if symptoms are getting worse.'
                    : 'Use this report as a clear handoff for a parent or guardian while monitoring closely and arranging follow-up if needed.')
              : (riskCode === 'EMERGENCY'
                  ? 'This pattern needs immediate action. Do not wait for symptoms to settle on their own.'
                  : riskCode === 'HIGH'
                    ? 'This pattern deserves prompt in-person review today, especially if symptoms intensify.'
                    : 'Use this report as a clear handoff for monitoring, follow-up, or escalation if symptoms change.')}
          </p>
        </div>
        {referral && (
          <div className="care-path-card">
            <span className="summary-kicker">Referral advice</span>
            <div className="care-path-type">{presentation?.riskLevel || riskLabel}</div>
            <div className="care-path-location">{referral.location}</div>
            <div className="care-path-action">{referralAdvice}</div>
          </div>
        )}
      </div>

      <div className="report-grid">
        <div className="report-section">
          <h3><Info size={18} /> Main concern summary</h3>
          <div className="findings-panel">
            <div className="finding-item">
              <strong>Detected language</strong>
              <span>{displayedLanguage}</span>
            </div>
            <div className="finding-item">
              <strong>Risk level</strong>
              <span>{riskLabel}</span>
            </div>
            <div className="finding-item">
              <strong>{concernLabel}</strong>
              <span>{observations.join(', ') || 'No symptom observations were captured.'}</span>
            </div>
            <div className="finding-item">
              <strong>Main concern summary</strong>
              {mainConcernSummary.includes('Common causes:') ? (
                <>
                  <div className="common-causes-block">
                    <span className="cause-header">Possible common causes</span>
                    <p>{mainConcernSummary.split('. ')[0].replace('Common causes: ', '')}</p>
                  </div>
                  <div className="clinical-knowledge-block">
                    {mainConcernSummary.split('. ').slice(1).join('. ')}
                  </div>
                </>
              ) : (
                <span>{mainConcernSummary}</span>
              )}
            </div>
          </div>
        </div>

        <div className="report-section">
          <h3><CheckCircle size={18} /> Safe guidance</h3>
          <div className="action-list">
            {safeGuidance.map((guidance, index) => (
              <div key={`${guidance}-${index}`} className="action-card">
                <span className={`action-urgency ${(instructions[index]?.urgency || 'medium').toLowerCase()}`}>{instructions[index]?.urgency || 'INFO'}</span>
                <strong>Guidance {index + 1}</strong>
                <p>{guidance}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="report-section medication-section">
        <h3><Info size={18} /> Referral advice</h3>
        <div className="finding-item">
          <strong>Best next step</strong>
          <span>{referralAdvice}</span>
        </div>
      </div>

      {medicationSuggestions.length > 0 && (
        <div className="report-section medication-section">
            <h3><Pill size={18} /> OTC medication guidance</h3>
            <p className="medication-intro">
              {pediatric
                ? 'For children, any medicine should be age-appropriate, measured carefully, and checked against the product label or a pharmacist\'s advice.'
                : 'These are limited over-the-counter options for symptom relief and should only be used exactly as label-directed.'}
            </p>
          <div className="medication-list">
            {medicationSuggestions.map((medication, index) => (
              <div key={`${medication.name}-${index}`} className="medication-card">
                <div className="medication-header">
                  <strong>{medication.name}</strong>
                  <span className={`medication-type ${medication.type === 'CLINICIAN_REVIEW' ? 'review' : 'otc'}`}>
                    {medication.type === 'CLINICIAN_REVIEW' ? 'Doctor review' : 'OTC option'}
                  </span>
                </div>
                <p>{medication.instructions}</p>
                <div className="medication-caution">{medication.cautions}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="disclaimer">
        <ShieldAlert size={16} />
        <span>This is safety guidance for demonstration purposes only. It does not replace professional medical advice or emergency services. Medication suggestions are limited and should only be followed as label-directed or after clinician review.</span>
      </div>

      <div className="raw-toggle-wrap">
        <button
          className="reset-btn raw-toggle"
          onClick={() => setShowRaw(!showRaw)}
        >
          <div className="raw-toggle-copy">
            <Code size={14} /> View interoperable FHIR R4 bundle
          </div>
          {showRaw ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        <AnimatePresence>
          {showRaw && (
            <MotionDiv
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <pre className="raw-json">
                {JSON.stringify(data, null, 2)}
              </pre>
            </MotionDiv>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        .report-card {
          padding: clamp(20px, 5vw, 32px);
          margin-top: 12px;
          max-width: 960px;
          width: 100%;
          border-top: 4px solid var(--primary);
        }

        .report-header {
          margin-bottom: 24px;
          padding-bottom: 18px;
          border-bottom: 1px solid var(--border-color);
        }

        .badge-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 14px;
        }

        .urgency-badge,
        .score-badge,
        .language-badge {
          display: inline-flex;
          align-items: center;
          min-height: 32px;
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.4px;
          border: 1px solid var(--border-color);
        }

        .score-badge,
        .language-badge {
          color: var(--text-secondary);
          background: var(--surface-muted);
        }

        h2 {
          margin: 0;
          font-size: clamp(1.4rem, 4vw, 1.8rem);
          color: var(--text-primary);
          line-height: 1.2;
          letter-spacing: -0.5px;
        }

        .timestamp {
          font-size: 12px;
          color: var(--text-muted);
          margin: 8px 0 0;
        }

        .summary-hero {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 18px;
          padding: 18px;
          margin-bottom: 24px;
          border: 1px solid var(--border-color);
          border-radius: 22px;
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

        .summary-lead h3 {
          margin: 0 0 10px;
          font-size: clamp(1.25rem, 2vw, 1.55rem);
          color: var(--text-primary);
          line-height: 1.25;
        }

        .summary-lead p,
        .care-path-action {
          margin: 0;
          color: var(--text-secondary);
          line-height: 1.65;
        }

        .care-path-card {
          background: var(--surface-strong);
          border: 1px solid var(--border-color);
          border-radius: 18px;
          padding: 18px;
        }

        .care-path-type {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 6px;
        }

        .care-path-location {
          color: var(--primary);
          margin-bottom: 10px;
          font-size: 14px;
        }

        .report-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 22px;
        }

        .report-section h3 {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 15px;
          color: var(--primary);
          margin-bottom: 14px;
        }

        .findings-panel,
        .action-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .finding-item,
        .action-card {
          background: var(--surface-muted);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 16px;
        }

        .finding-item strong,
        .action-card strong {
          display: block;
          color: var(--text-primary);
          margin-bottom: 6px;
        }

        .finding-item span,
        .action-card p {
          color: var(--text-secondary);
          line-height: 1.6;
          margin: 0;
        }

        .action-urgency {
          display: inline-flex;
          margin-bottom: 10px;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
          background: var(--surface-soft);
          color: var(--primary);
        }

        .action-urgency.high { background: var(--danger-soft); color: var(--danger); }
        .action-urgency.medium { background: var(--warning-soft); color: var(--warning); }
        .action-urgency.low { background: rgba(134, 239, 172, 0.16); color: #86efac; }

        .disclaimer {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-top: 26px;
          padding: 14px 16px;
          border-radius: 14px;
          border: 1px solid var(--border-color);
          background: var(--surface-muted);
          color: var(--text-secondary);
          font-size: 12px;
          line-height: 1.6;
        }

        .medication-section {
          margin-top: 22px;
        }

        .medication-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .medication-intro {
          margin: 0 0 12px;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        .medication-card {
          background: var(--surface-muted);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 16px;
        }

        .medication-header {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 10px;
        }

        .medication-header strong {
          color: var(--text-primary);
        }

        .medication-type {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
        }

        .medication-type.otc {
          background: var(--success-soft);
          color: var(--success);
        }

        .medication-type.review {
          background: var(--warning-soft);
          color: var(--warning);
        }

        .medication-card p {
          color: var(--text-secondary);
          line-height: 1.6;
          margin: 0 0 10px;
        }

        .medication-caution {
          color: var(--text-muted);
          font-size: 12px;
          line-height: 1.6;
        }
        
        .common-causes-block {
          background: var(--surface-soft);
          border-radius: 12px;
          padding: 14px;
          margin: 12px 0;
          border-left: 3px solid var(--primary);
        }
        
        .cause-header {
          display: block;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: var(--primary);
          margin-bottom: 6px;
        }
        
        .common-causes-block p {
          font-size: 14px !important;
          color: var(--text-primary) !important;
          margin: 0 !important;
        }
        
        .clinical-knowledge-block {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.6;
          margin-top: 10px;
        }

        .raw-toggle-wrap {
          margin-top: 22px;
          border-top: 1px solid var(--border-color);
          padding-top: 20px;
        }

        .raw-toggle {
          width: 100%;
          justify-content: space-between;
          padding: 12px 16px;
          font-size: 12px;
        }

        .raw-toggle-copy {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .raw-json {
          background: var(--surface-strong);
          padding: 16px;
          border-radius: 12px;
          margin-top: 12px;
          font-size: 11px;
          color: var(--text-secondary);
          overflow-x: auto;
          border: 1px solid var(--border-color);
        }

        @media (max-width: 900px) {
          .summary-hero,
          .report-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 480px) {
          .report-card { margin-top: 8px; border-radius: 14px; }
          .summary-hero { padding: 16px; border-radius: 16px; }
        }
      `}</style>
    </MotionDiv>
  );
};

export default ReportCard;
