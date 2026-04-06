import React from 'react';
import { getRiskTheme } from '../lib/clinicalPresentation';

const RiskBadge = ({ level, suffix = 'risk', compact = false }) => {
  const theme = getRiskTheme(level);

  return (
    <div
      className={`risk-badge-ui ${compact ? 'compact' : ''} ${theme.key.toLowerCase()}`}
      style={{
        '--risk-accent': theme.accent,
        '--risk-soft': theme.soft,
        '--risk-border': theme.border
      }}
    >
      <span className="risk-dot" aria-hidden="true" />
      <span className="risk-label">
        {theme.label} {suffix}
      </span>
      {theme.key === 'EMERGENCY' && <span className="risk-urgent">Urgent</span>}

      <style>{`
        .risk-badge-ui {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          min-height: 38px;
          padding: 8px 14px;
          border-radius: 999px;
          border: 1px solid var(--risk-border);
          background: var(--risk-soft);
          color: var(--risk-accent);
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.45px;
          text-transform: uppercase;
        }

        .risk-badge-ui.compact {
          min-height: 32px;
          padding: 6px 12px;
          font-size: 11px;
        }

        .risk-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: var(--risk-accent);
          box-shadow: 0 0 0 4px color-mix(in srgb, var(--risk-accent) 18%, transparent);
        }

        .risk-label {
          white-space: nowrap;
        }

        .risk-urgent {
          padding: 4px 8px;
          border-radius: 999px;
          background: color-mix(in srgb, var(--risk-accent) 18%, white);
          color: white;
          font-size: 10px;
          letter-spacing: 0.65px;
        }
      `}</style>
    </div>
  );
};

export default RiskBadge;
