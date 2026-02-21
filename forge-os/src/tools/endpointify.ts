import type { MCPServer } from "mcp-use/server";
import { z } from "zod";
import { runEndpointify } from "../services/endpointify/pipeline.js";
import { logActivity, logToolCall, makeId, nowIso, type WorkspaceState } from "../state/store.js";
import { renderWorkspace } from "./helpers.js";

export function registerEndpointifyTool(server: MCPServer, state: WorkspaceState) {
  server.tool(
    {
      name: "endpointify",
      description: "Analyze a URL and extract interactive components as MCP-ready primitives.",
      schema: z.object({
        url: z.string().url(),
        options: z
          .object({
            forceLive: z.boolean().optional(),
            timeoutMs: z.number().int().positive().optional()
          })
          .optional()
      }),
      widget: {
        name: "workspace",
        invoking: "Analyzing URL...",
        invoked: "Component map ready"
      }
    },
    async ({ url, options }) => {
      const result = await runEndpointify(url, options);
      const jobId = makeId("job");

      state.endpointifyJobs.set(jobId, {
        id: jobId,
        url,
        result,
        selectedComponentIds: result.components.map((cmp) => cmp.id),
        createdAt: nowIso()
      });

      state.stats.endpointified += 1;

      logToolCall(state, "endpointify");
      logActivity(state, {
        kind: "endpointified",
        title: "Endpointified URL",
        detail: `${new URL(url).host} -> ${result.components.length} components`
      });

      return renderWorkspace(state, `Detected ${result.components.length} components`, {
        endpointify_job_id: jobId,
        endpointify_result: result
      });
    }
  );
}
