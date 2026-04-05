import React from 'react';
import { Layers, ShieldAlert, FileText, ArrowRightCircle, AlertCircle, MessageSquare } from 'lucide-react';

const MultimodalSummaryCard = ({ summary }) => {
  if (!summary) return null;

  return (
    <div className="multimodal-summary-card">
      <div className="summary-header">
        <span className="summary-pill"><Layers size={14} /> Final multimodal response</span>
      </div>

      <div className="summary-grid">
        <section className="summary-section">
          <h3><FileText size={16} /> 1. Input type detected</h3>
          <p>{summary.inputTypeDetected || 'Input detected'}</p>
        </section>

        <section className="summary-section">
          <h3><ShieldAlert size={16} /> 2. Risk level</h3>
          <p>{summary.riskLevel || 'Moderate'}</p>
        </section>

        <section className="summary-section full-width">
          <h3><FileText size={16} /> 3. Safe summary</h3>
          <p>{summary.safeSummary || 'A cautious summary was not available.'}</p>
        </section>

        <section className="summary-section">
          <h3><ArrowRightCircle size={16} /> 4. Recommended next step</h3>
          <p>{summary.recommendedNextStep || 'Arrange medical follow-up if needed.'}</p>
        </section>

        <section className="summary-section">
          <h3><AlertCircle size={16} /> 5. Emergency advice, if needed</h3>
          <p>{summary.emergencyAdvice || 'No immediate emergency warning was highlighted from this review.'}</p>
        </section>

        <section className="summary-section full-width">
          <h3><MessageSquare size={16} /> 6. Final user-facing response</h3>
          <p>{summary.finalUserFacingResponse || 'Use the guidance above and seek medical care sooner if symptoms worsen.'}</p>
        </section>
      </div>

      <style>{`
        .multimodal-summary-card {
          margin-bottom: 22px;
          border: 1px solid var(--border-color);
          border-radius: 20px;
          padding: 18px;
          background: linear-gradient(160deg, var(--surface-soft), transparent);
        }

        .summary-header {
          margin-bottom: 14px;
        }

        .summary-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 7px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          color: var(--primary);
          background: var(--surface-strong);
          border: 1px solid var(--border-color);
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .summary-section {
          background: var(--surface-muted);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 16px;
        }

        .summary-section.full-width {
          grid-column: 1 / -1;
        }

        .summary-section h3 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 10px;
          color: var(--primary);
          font-size: 14px;
        }

        .summary-section p {
          margin: 0;
          color: var(--text-secondary);
          line-height: 1.65;
        }

        @media (max-width: 900px) {
          .summary-grid {
            grid-template-columns: 1fr;
          }

          .summary-section.full-width {
            grid-column: auto;
          }
        }
      `}</style>
    </div>
  );
};

export default MultimodalSummaryCard;
