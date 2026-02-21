import type { MCPServer } from "mcp-use/server";
import { z } from "zod";
import { detectCompositeCandidate } from "../services/composite/patterns.js";
import { logActivity, logToolCall, type WorkspaceState } from "../state/store.js";
import { renderWorkspace } from "./helpers.js";

export function registerGenerateCompositeTool(server: MCPServer, state: WorkspaceState) {
  server.tool(
    {
      name: "generate_composite",
      description: "Detect repeated tool patterns and propose a new composite tool.",
      schema: z.object({
        pattern_hint: z.string().optional()
      }),
      widget: {
        name: "workspace",
        invoking: "Mining call patterns...",
        invoked: "Composite proposal ready"
      }
    },
    async ({ pattern_hint }) => {
      const candidate = detectCompositeCandidate(state, pattern_hint);
      if (!candidate) {
        return renderWorkspace(state, "No strong composite pattern detected yet", {
          proposed: false
        });
      }

      state.composites.set(candidate.id, candidate);
      logToolCall(state, "generate_composite");
      logActivity(state, {
        kind: "composite_proposed",
        title: "Composite Proposed",
        detail: `${candidate.name}: ${candidate.chain.join(" -> ")}`
      });

      return renderWorkspace(state, `Proposed composite ${candidate.name}`, {
        proposed: true,
        composite_id: candidate.id
      });
    }
  );
}
