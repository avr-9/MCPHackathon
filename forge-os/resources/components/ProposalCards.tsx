import type { CompositeTool, TrialProposal } from "./types";

interface ProposalCardsProps {
  trial?: TrialProposal;
  composite?: CompositeTool;
  onAcceptTrial: (trialId: string) => void;
  onRejectTrial: (trialId: string) => void;
  onTestComposite: (compositeId: string) => void;
}

export function ProposalCards({
  trial,
  composite,
  onAcceptTrial,
  onRejectTrial,
  onTestComposite
}: ProposalCardsProps) {
  return (
    <div className="proposal-stack">
      {trial && trial.state === "proposed" ? (
        <article className="proposal-card">
          <h4>Optimization Proposed</h4>
          <p>{trial.serverId}</p>
          <div className="compare-grid">
            <div>
              <small>Original</small>
              <p>{trial.baselineSummary}</p>
            </div>
            <div>
              <small>Candidate</small>
              <p>{trial.candidateSummary}</p>
            </div>
          </div>
          <div className="actions">
            <button type="button" className="primary-btn" onClick={() => onAcceptTrial(trial.trialId)}>
              Accept
            </button>
            <button type="button" className="ghost-btn" onClick={() => onRejectTrial(trial.trialId)}>
              Keep Original
            </button>
          </div>
        </article>
      ) : null}

      {composite && composite.status === "proposed" ? (
        <article className="proposal-card composite">
          <h4>New Composite Proposed</h4>
          <p>{composite.name}</p>
          <small>{composite.chain.join(" + ")}</small>
          <div className="actions">
            <button type="button" className="primary-btn" onClick={() => onTestComposite(composite.id)}>
              Test It
            </button>
          </div>
        </article>
      ) : null}
    </div>
  );
}
