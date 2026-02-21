import type { MCPServer } from "mcp-use/server";
import type { WorkspaceState } from "../state/store.js";
import { registerAcceptOptimizationTool } from "./accept-optimization.js";
import { registerEndpointifyGenerateTool } from "./endpointify-generate.js";
import { registerEndpointifyTool } from "./endpointify.js";
import { registerGenerateCompositeTool } from "./generate-composite.js";
import { registerGetStatusTool } from "./get-status.js";
import { registerLoadEvolvedStateTool } from "./load-evolved-state.js";
import { registerOptimizeTool } from "./optimize.js";
import { registerRejectOptimizationTool } from "./reject-optimization.js";
import { registerRouteQueryTool } from "./route-query.js";
import { registerTestCompositeTool } from "./test-composite.js";

export function registerAllTools(server: MCPServer, state: WorkspaceState) {
  registerEndpointifyTool(server, state);
  registerEndpointifyGenerateTool(server, state);
  registerOptimizeTool(server, state);
  registerAcceptOptimizationTool(server, state);
  registerRejectOptimizationTool(server, state);
  registerGenerateCompositeTool(server, state);
  registerTestCompositeTool(server, state);
  registerRouteQueryTool(server, state);
  registerGetStatusTool(server, state);
  registerLoadEvolvedStateTool(server, state);
}
