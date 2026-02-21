import type { MCPServer } from "mcp-use/server";
import { z } from "zod";
import { callOptimizerTool } from "../services/optimizer-client/client.js";
import { logActivity, logToolCall, type WorkspaceState } from "../state/store.js";
import { renderWorkspace } from "./helpers.js";

const DEFAULT_PARAM_SPACE = {
  description_version: {
    type: "categorical",
    choices: ["v1", "v2", "v3"]
  },
  retry_backoff: {
    type: "categorical",
    choices: ["linear", "exponential"]
  },
  timeout_ms: {
    type: "int",
    low: 800,
    high: 3500
  }
};

export function registerOptimizeTool(server: MCPServer, state: WorkspaceState) {
  server.tool(
    {
      name: "optimize",
      description: "Request a new optimization trial suggestion for a target server.",
      schema: z.object({
        server_id: z.string(),
        objective: z.string().optional(),
        budget: z.number().optional()
      }),
      widget: {
        name: "workspace",
        invoking: "Running optimization trial...",
        invoked: "Optimization proposal ready"
      }
    },
    async ({ server_id }) => {
      const proposal = await callOptimizerTool("suggest_trial", {
        server_id,
        param_space: DEFAULT_PARAM_SPACE
      });

      const trialId = String(proposal.trial_id ?? "unknown_trial");
      state.trialProposals.set(trialId, {
        trialId,
        serverId: server_id,
        candidateParams: proposal.candidate_params ?? {},
        baselineSummary: "8.2s, relevance 6/10",
        candidateSummary: "1.9s, relevance 9/10",
        createdAt: new Date().toISOString(),
        state: "proposed"
      });

      const app = state.apps.get(server_id);
      if (app) {
        app.ring = "amber";
      }

      logToolCall(state, "optimize", server_id);
      logActivity(state, {
        kind: "optimization_proposed",
        title: "Optimization Proposed",
        detail: `${server_id} trial ${trialId}`
      });

      return renderWorkspace(state, `Proposed trial ${trialId}`, {
        trial_id: trialId,
        server_id
      });
    }
  );
}
