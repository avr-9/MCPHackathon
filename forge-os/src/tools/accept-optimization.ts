import type { MCPServer } from "mcp-use/server";
import { z } from "zod";
import { callOptimizerTool } from "../services/optimizer-client/client.js";
import { logActivity, logToolCall, type WorkspaceState } from "../state/store.js";
import { renderWorkspace } from "./helpers.js";

export function registerAcceptOptimizationTool(server: MCPServer, state: WorkspaceState) {
  server.tool(
    {
      name: "accept_optimization",
      description: "Accept an optimization trial and apply positive feedback.",
      schema: z.object({
        trial_id: z.string()
      }),
      widget: {
        name: "workspace",
        invoking: "Applying optimization...",
        invoked: "Optimization accepted"
      }
    },
    async ({ trial_id }) => {
      const proposal = state.trialProposals.get(trial_id);
      if (!proposal) {
        throw new Error(`Unknown trial: ${trial_id}`);
      }

      await callOptimizerTool("record_feedback", {
        trial_id,
        reward: 1,
        metrics: {
          latency_delta_ms: 6300,
          quality_delta: 3
        }
      });

      proposal.state = "accepted";
      state.stats.optimizations += 1;
      state.stats.speedGainPct += 45;

      const app = state.apps.get(proposal.serverId);
      if (app) {
        app.ring = "green";
      }

      logToolCall(state, "accept_optimization", proposal.serverId);
      logActivity(state, {
        kind: "optimized",
        title: "Optimization Accepted",
        detail: `${proposal.serverId} trial ${trial_id}`
      });

      return renderWorkspace(state, `Accepted trial ${trial_id}`, {
        trial_id,
        state: "accepted"
      });
    }
  );
}
