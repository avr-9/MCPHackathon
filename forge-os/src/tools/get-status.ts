import type { MCPServer } from "mcp-use/server";
import { z } from "zod";
import { renderWorkspace } from "./helpers.js";
import type { WorkspaceState } from "../state/store.js";

export function registerGetStatusTool(server: MCPServer, state: WorkspaceState) {
  server.tool(
    {
      name: "get_status",
      description: "Get current in-memory app, optimization, and activity status.",
      schema: z.object({
        scope: z.enum(["all", "apps", "activity", "routes"]).optional()
      }),
      widget: {
        name: "workspace",
        invoking: "Refreshing status...",
        invoked: "Status refreshed"
      }
    },
    async ({ scope }) => {
      return renderWorkspace(state, "Workspace status ready", {
        scope: scope ?? "all"
      });
    }
  );
}
