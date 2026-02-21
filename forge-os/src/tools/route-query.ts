import type { MCPServer } from "mcp-use/server";
import { z } from "zod";
import { routeMessage } from "../services/router/router.js";
import { logActivity, logToolCall, type WorkspaceState } from "../state/store.js";
import { renderWorkspace } from "./helpers.js";

export function registerRouteQueryTool(server: MCPServer, state: WorkspaceState) {
  server.tool(
    {
      name: "route_query",
      description: "Route a user message across connected apps and return merged results.",
      schema: z.object({
        user_message: z.string(),
        override_apps: z.array(z.string()).optional(),
        constraints: z.record(z.string(), z.unknown()).optional()
      }),
      widget: {
        name: "workspace",
        invoking: "Routing query...",
        invoked: "Routed result ready"
      }
    },
    async ({ user_message, override_apps }) => {
      const route = routeMessage(state, user_message, override_apps);
      state.routes.unshift(route);
      state.routes = state.routes.slice(0, 25);

      for (const appId of route.appPath) {
        logToolCall(state, "route_query", appId);
      }

      logActivity(state, {
        kind: "route_executed",
        title: "Query Routed",
        detail: `${route.appPath.join(" -> ")} (${route.metrics.latencyMs}ms)`
      });

      return renderWorkspace(state, "Route execution complete", {
        route
      });
    }
  );
}
