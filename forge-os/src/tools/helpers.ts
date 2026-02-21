import { text, widget } from "mcp-use/server";
import type { WorkspaceState } from "../state/store.js";
import { workspaceSnapshot } from "../state/store.js";

export function renderWorkspace(
  state: WorkspaceState,
  message: string,
  focus?: Record<string, unknown>
) {
  return widget({
    props: {
      workspace: workspaceSnapshot(state),
      focus: focus ?? null
    },
    output: text(message)
  });
}
