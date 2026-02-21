import type { MCPServer } from "mcp-use/server";
import { z } from "zod";
import { logActivity, logToolCall, type WorkspaceState } from "../state/store.js";
import { routeMessage } from "../services/router/router.js";
import { renderWorkspace } from "./helpers.js";

export function registerTestCompositeTool(server: MCPServer, state: WorkspaceState) {
  server.tool(
    {
      name: "test_composite",
      description: "Run and preview a proposed composite tool.",
      schema: z.object({
        composite_id: z.string(),
        input: z.record(z.string(), z.unknown()).optional()
      }),
      widget: {
        name: "workspace",
        invoking: "Testing composite...",
        invoked: "Composite test complete"
      }
    },
    async ({ composite_id }) => {
      const composite = state.composites.get(composite_id);
      if (!composite) {
        throw new Error(`Unknown composite: ${composite_id}`);
      }

      const preview = routeMessage(state, `Composite test ${composite.name}`, composite.chain.map((chain) => chain.split(".")[0]));
      state.routes.unshift(preview);
      state.routes = state.routes.slice(0, 25);

      composite.status = "accepted";
      state.apps.set(composite.id, {
        id: composite.id,
        name: composite.name,
        icon: "P",
        kind: "composite",
        ring: "blue",
        badges: ["new"],
        toolNames: ["run_composite"],
        createdAt: new Date().toISOString()
      });
      state.stats.newApps += 1;

      logToolCall(state, "test_composite", composite.id);
      logActivity(state, {
        kind: "composite_accepted",
        title: "Composite Activated",
        detail: `${composite.name} added to dock`
      });

      return renderWorkspace(state, `Composite ${composite.name} tested successfully`, {
        composite_id,
        accepted: true
      });
    }
  );
}
