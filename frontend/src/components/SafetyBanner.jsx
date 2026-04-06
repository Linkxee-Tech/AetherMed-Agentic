import React from 'react';
import { AlertCircle, ShieldAlert } from 'lucide-react';

const toneIcon = {
  info: AlertCircle,
  warning: ShieldAlert,
  urgent: ShieldAlert
};

const SafetyBanner = ({ title, message, tone = 'warning', compact = false }) => {
  const Icon = toneIcon[tone] || ShieldAlert;

  return (
    <div className={`safety-banner ${tone} ${compact ? 'compact' : ''}`}>
      <div className="safety-banner-icon">
        <Icon size={compact ? 16 : 18} />
      </div>
      <div className="safety-banner-copy">
        <strong>{title}</strong>
        <span>{message}</span>
      </div>

      <style>{`
        .safety-banner {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          width: 100%;
          padding: 16px 18px;
          border-radius: 18px;
          border: 1px solid var(--border-color);
          background: var(--surface-muted);
          color: var(--text-secondary);
        }

        .safety-banner.compact {
          padding: 14px 16px;
          border-radius: 16px;
          gap: 10px;
        }

        .safety-banner.warning {
          border-color: color-mix(in srgb, var(--warning) 36%, var(--border-color));
          background: color-mix(in srgb, var(--warning-soft) 70%, var(--surface-muted));
        }

        .safety-banner.urgent {
          border-color: color-mix(in srgb, var(--danger) 42%, var(--border-color));
          background: color-mix(in srgb, var(--danger-soft) 78%, var(--surface-muted));
        }

        .safety-banner.info {
          border-color: color-mix(in srgb, var(--primary) 32%, var(--border-color));
          background: color-mix(in srgb, var(--surface-soft) 75%, var(--surface-muted));
        }

        .safety-banner-icon {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: var(--surface-strong);
          color: var(--text-primary);
          flex-shrink: 0;
        }

        .safety-banner-copy {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }

        .safety-banner-copy strong {
          color: var(--text-primary);
          font-size: 14px;
          line-height: 1.35;
        }

        .safety-banner-copy span {
          color: var(--text-secondary);
          line-height: 1.65;
          font-size: 13px;
        }
      `}</style>
    </div>
  );
};

export default SafetyBanner;
