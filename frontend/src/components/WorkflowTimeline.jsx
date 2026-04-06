import React from 'react';
import { Activity, ArrowRightCircle, FileText, Search, ShieldCheck } from 'lucide-react';
import AgentPulse from './AgentPulse';

const iconByStepId = {
  analyze: Activity,
  risk: ShieldCheck,
  insights: Search,
  recommendations: FileText,
  next: ArrowRightCircle
};

const WorkflowTimeline = ({
  title,
  description,
  steps,
  activeIndex = -1,
  completedCount = 0,
  activeAgent = null,
  activeInsight = '',
  agents = [],
  completedAgents = [],
  preview = false
}) => {
  return (
    <div className={`workflow-timeline glass ${preview ? 'preview' : ''}`}>
      <div className="workflow-header">
        <div>
          <span className="workflow-kicker">{preview ? 'Clinical workflow' : 'Agent workflow'}</span>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        <div className={`workflow-state ${preview ? 'preview' : 'live'}`}>
          {preview ? 'Ready for intake' : activeAgent || 'Finalizing response'}
        </div>
      </div>

      <div className="workflow-step-list">
        {steps.map((step, index) => {
          const Icon = iconByStepId[step.id] || Activity;
          const status = preview
            ? 'preview'
            : index < completedCount
              ? 'complete'
              : index === activeIndex
                ? 'active'
                : 'pending';

          return (
            <div key={step.id} className={`workflow-step ${status}`}>
              <div className="workflow-step-icon">
                <Icon size={18} />
              </div>
              <div className="workflow-step-copy">
                <strong>{step.title}</strong>
                <span>{step.description}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="workflow-bottom">
        <div className="workflow-insight">
          <span className="workflow-kicker">{preview ? 'What judges will see' : 'Current system insight'}</span>
          <p>{activeInsight || 'AetherMed presents a staged review so the decision-support process feels visible, structured, and safe.'}</p>
        </div>

        <div className="workflow-agent-grid">
          {agents.map((agent) => (
            <AgentPulse
              key={agent}
              name={agent}
              active={!preview && activeAgent === agent}
              complete={preview ? false : completedAgents.includes(agent)}
            />
          ))}
        </div>
      </div>

      <style>{`
        .workflow-timeline {
          width: 100%;
          padding: clamp(20px, 4vw, 28px);
          border-radius: 24px;
        }

        .workflow-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 18px;
          margin-bottom: 20px;
        }

        .workflow-kicker {
          display: inline-block;
          margin-bottom: 10px;
          color: var(--text-muted);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.2px;
          text-transform: uppercase;
        }

        .workflow-header h3 {
          margin: 0 0 8px;
          color: var(--text-primary);
          font-size: clamp(1.15rem, 2.5vw, 1.45rem);
          line-height: 1.2;
        }

        .workflow-header p {
          margin: 0;
          color: var(--text-secondary);
          line-height: 1.7;
          max-width: 60ch;
        }

        .workflow-state {
          white-space: nowrap;
          min-height: 36px;
          padding: 8px 12px;
          border-radius: 999px;
          border: 1px solid var(--border-color);
          background: var(--surface-muted);
          color: var(--text-primary);
          font-size: 12px;
          font-weight: 800;
        }

        .workflow-state.live {
          color: var(--primary);
          background: var(--surface-soft);
        }

        .workflow-step-list {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 12px;
        }

        .workflow-step {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-height: 170px;
          padding: 16px;
          border-radius: 18px;
          border: 1px solid var(--border-color);
          background: var(--surface-muted);
          transition: transform 0.25s ease, border-color 0.25s ease, background 0.25s ease;
        }

        .workflow-step.preview {
          background: linear-gradient(180deg, color-mix(in srgb, var(--surface-soft) 54%, transparent), var(--surface-muted));
        }

        .workflow-step.active {
          background: linear-gradient(180deg, color-mix(in srgb, var(--surface-soft) 80%, transparent), var(--surface-muted));
          border-color: color-mix(in srgb, var(--primary) 44%, var(--border-color));
          transform: translateY(-2px);
        }

        .workflow-step.complete {
          border-color: color-mix(in srgb, var(--success) 35%, var(--border-color));
          background: color-mix(in srgb, var(--success-soft) 45%, var(--surface-muted));
        }

        .workflow-step-icon {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: var(--surface-strong);
          color: var(--primary);
          border: 1px solid var(--border-color);
        }

        .workflow-step.complete .workflow-step-icon {
          color: var(--success);
        }

        .workflow-step-copy {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .workflow-step-copy strong {
          color: var(--text-primary);
          line-height: 1.35;
          font-size: 14px;
        }

        .workflow-step-copy span {
          color: var(--text-secondary);
          line-height: 1.6;
          font-size: 13px;
        }

        .workflow-bottom {
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
          gap: 16px;
          margin-top: 20px;
        }

        .workflow-insight {
          padding: 16px;
          border-radius: 18px;
          background: var(--surface-muted);
          border: 1px solid var(--border-color);
        }

        .workflow-insight p {
          margin: 0;
          color: var(--text-secondary);
          line-height: 1.65;
        }

        .workflow-agent-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        @media (max-width: 1100px) {
          .workflow-step-list {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .workflow-bottom {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 700px) {
          .workflow-header {
            flex-direction: column;
          }

          .workflow-step-list,
          .workflow-agent-grid {
            grid-template-columns: 1fr;
          }

          .workflow-step {
            min-height: auto;
          }
        }
      `}</style>
    </div>
  );
};

export default WorkflowTimeline;
