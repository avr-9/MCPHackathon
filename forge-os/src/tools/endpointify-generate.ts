import type { MCPServer } from "mcp-use/server";
import { z } from "zod";
import { logActivity, logToolCall, makeId, nowIso, type AppEntry, type WorkspaceState } from "../state/store.js";
import { renderWorkspace } from "./helpers.js";

export function registerEndpointifyGenerateTool(server: MCPServer, state: WorkspaceState) {
  server.tool(
    {
      name: "endpointify_generate",
      description: "Generate a new app definition from selected endpoint components.",
      schema: z.object({
        endpointify_job_id: z.string(),
        selected_components: z.array(z.string()).min(1)
      }),
      widget: {
        name: "workspace",
        invoking: "Generating app...",
        invoked: "New app added"
      }
    },
    async ({ endpointify_job_id, selected_components }) => {
      const job = state.endpointifyJobs.get(endpointify_job_id);
      if (!job) {
        throw new Error(`Unknown endpointify job: ${endpointify_job_id}`);
      }

      job.selectedComponentIds = selected_components;
      const host = new URL(job.url).hostname.replace(/^www\./, "");
      const appId = host.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
      const title = host
        .split(".")[0]
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, (m) => m.toUpperCase());

      const newApp: AppEntry = {
        id: appId,
        name: title,
        icon: title.slice(0, 1).toUpperCase(),
        kind: "endpointified",
        ring: "blue",
        badges: ["web"],
        toolNames: selected_components.map((id) => `tool_${id}`),
        createdAt: nowIso()
      };

      state.apps.set(newApp.id, newApp);
      state.stats.newApps += 1;

      logToolCall(state, "endpointify_generate", newApp.id);
      logActivity(state, {
        kind: "endpointified",
        title: "Generated App",
        detail: `${newApp.name} with ${selected_components.length} tools`
      });

      return renderWorkspace(state, `Generated ${newApp.name}`, {
        endpointify_job_id,
        generated_app_id: newApp.id
      });
    }
  );
}
