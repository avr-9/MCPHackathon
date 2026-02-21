import type { MCPServer } from "mcp-use/server";
import { z } from "zod";
import { loadEvolvedStateInto, logToolCall, type WorkspaceState } from "../state/store.js";
import { renderWorkspace } from "./helpers.js";

export function registerLoadEvolvedStateTool(server: MCPServer, state: WorkspaceState) {
  server.tool(
    {
      name: "load_evolved_state",
      description: "Load the hardcoded one-week evolution demo state.",
      schema: z.object({}),
      widget: {
        name: "workspace",
        invoking: "Loading evolved state...",
        invoked: "Evolved state loaded"
      }
    },
    async () => {
      loadEvolvedStateInto(state);
      logToolCall(state, "load_evolved_state");
      return renderWorkspace(state, "Evolved state loaded", {
        evolved: true
      });
    }
  );
}
