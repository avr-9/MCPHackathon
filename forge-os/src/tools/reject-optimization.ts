import type { MCPServer } from "mcp-use/server";
import { z } from "zod";
import { callOptimizerTool } from "../services/optimizer-client/client.js";
import { logActivity, logToolCall, type WorkspaceState } from "../state/store.js";
import { renderWorkspace } from "./helpers.js";

export function registerRejectOptimizationTool(server: MCPServer, state: WorkspaceState) {
  server.tool(
    {
      name: "reject_optimization",
      description: "Reject an optimization trial and keep baseline behavior.",
      schema: z.object({
        trial_id: z.string(),
        reason: z.string().optional()
      }),
      widget: {
        name: "workspace",
        invoking: "Reverting trial...",
        invoked: "Trial rejected"
      }
    },
    async ({ trial_id, reason }) => {
      const proposal = state.trialProposals.get(trial_id);
      if (!proposal) {
        throw new Error(`Unknown trial: ${trial_id}`);
      }

      await callOptimizerTool("record_feedback", {
        trial_id,
        reward: 0,
        metrics: {
          reason: reason ?? "No reason provided",
          latency_delta_ms: 0,
          quality_delta: -1
        }
      });

      proposal.state = "rejected";
      const app = state.apps.get(proposal.serverId);
      if (app) {
        app.ring = "amber";
      }

      logToolCall(state, "reject_optimization", proposal.serverId);
      logActivity(state, {
        kind: "optimization_rejected",
        title: "Optimization Rejected",
        detail: `${proposal.serverId} trial ${trial_id}`
      });

      return renderWorkspace(state, `Rejected trial ${trial_id}`, {
        trial_id,
        state: "rejected"
      });
    }
  );
}
