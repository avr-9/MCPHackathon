import { useEffect, useMemo, useState } from "react";
import { useWidget } from "mcp-use/react";
import { ActivityFeed } from "./components/ActivityFeed";
import { ComponentMap } from "./components/ComponentMap";
import { Dock } from "./components/Dock";
import { FloatingPanels } from "./components/FloatingPanels";
import { ForgeBar } from "./components/ForgeBar";
import { ProposalCards } from "./components/ProposalCards";
import type { WorkspacePayload } from "./components/types";
import "./styles.css";

interface WorkspaceProps {
  workspace?: WorkspacePayload;
  focus?: Record<string, unknown> | null;
}

export default function WorkspaceWidget() {
  const { props, callTool, sendFollowUpMessage, isPending } = useWidget<WorkspaceProps>();
  const workspace = props.workspace;

  const [urlInput, setUrlInput] = useState("https://news.ycombinator.com/");
  const [selectedAppId, setSelectedAppId] = useState<string | undefined>(undefined);
  const latestJob = useMemo(
    () => workspace?.endpointifyJobs[0],
    [workspace?.endpointifyJobs]
  );
  const [selectedComponents, setSelectedComponents] = useState<string[]>([]);

  useEffect(() => {
    if (latestJob) {
      setSelectedComponents(latestJob.selectedComponentIds);
    }
  }, [latestJob]);

  const latestRoute = workspace?.routes[0];
  const latestTrial = workspace?.trialProposals.find((item) => item.state === "proposed");
  const latestComposite = workspace?.composites.find((item) => item.status === "proposed");

  const runEndpointify = async () => {
    await callTool("endpointify", { url: urlInput });
  };

  const generateFromSelection = async () => {
    if (!latestJob) return;
    await callTool("endpointify_generate", {
      endpointify_job_id: latestJob.id,
      selected_components: selectedComponents
    });
    await sendFollowUpMessage(`Generated app from ${new URL(latestJob.url).host}`);
  };

  const runRoute = async () => {
    await callTool("route_query", {
      user_message: "Catch me up on engineering today",
      override_apps: selectedAppId ? [selectedAppId] : undefined
    });
  };

  const toggleComponent = (id: string) => {
    setSelectedComponents((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const acceptTrial = async (trialId: string) => {
    await callTool("accept_optimization", { trial_id: trialId });
    await sendFollowUpMessage(`accepted_trial:${trialId}`);
  };

  const rejectTrial = async (trialId: string) => {
    await callTool("reject_optimization", { trial_id: trialId, reason: "Stage preference" });
  };

  const testComposite = async (compositeId: string) => {
    await callTool("test_composite", { composite_id: compositeId });
    await sendFollowUpMessage(`accept_composite:${compositeId}`);
  };

  const loadEvolved = async () => {
    await callTool("load_evolved_state", {});
  };

  if (!workspace) {
    return (
      <div className="workspace-shell loading">
        <p>{isPending ? "Loading workspace..." : "Run get_status to initialize workspace."}</p>
      </div>
    );
  }

  return (
    <div className="workspace-shell">
      <ForgeBar stats={workspace.stats} />

      <section className="workspace-grid">
        <div className="left-stage">
          <div className="desktop-stage">
            <div className="status-strip">
              <span>{new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
              <span className="status-icons">wifi ▰</span>
            </div>
            <div className="home-grid">
              {workspace.apps.map((app) => (
                <button
                  type="button"
                  key={`home_${app.id}`}
                  className={`home-icon-tile ring-${app.ring} ${selectedAppId === app.id ? "active" : ""}`}
                  onClick={() => setSelectedAppId(app.id)}
                >
                  <span className="home-icon">{app.icon}</span>
                  <span className="home-label">{app.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="controls-row">
            <input
              value={urlInput}
              onChange={(event) => setUrlInput(event.target.value)}
              placeholder="Paste URL to endpointify"
            />
            <button type="button" className="primary-btn" onClick={runEndpointify}>
              Endpointify
            </button>
            <button type="button" className="ghost-btn" onClick={() => callTool("optimize", { server_id: "slack" })}>
              Optimize
            </button>
            <button type="button" className="ghost-btn" onClick={() => callTool("generate_composite", {})}>
              Propose Composite
            </button>
            <button type="button" className="ghost-btn" onClick={runRoute}>
              Route Query
            </button>
            <button type="button" className="ghost-btn" onClick={loadEvolved}>
              One Week Later
            </button>
          </div>

          <FloatingPanels route={latestRoute} />
          <ComponentMap
            job={latestJob}
            selected={selectedComponents}
            onToggle={toggleComponent}
            onGenerate={generateFromSelection}
          />
          <ProposalCards
            trial={latestTrial}
            composite={latestComposite}
            onAcceptTrial={acceptTrial}
            onRejectTrial={rejectTrial}
            onTestComposite={testComposite}
          />
        </div>

        <ActivityFeed events={workspace.activity} />
      </section>

      <Dock apps={workspace.apps} onSelect={setSelectedAppId} selectedAppId={selectedAppId} />
    </div>
  );
}
