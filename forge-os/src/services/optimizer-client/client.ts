import { MCPClient } from "mcp-use";

let client: MCPClient | null = null;
let sessionReady = false;

function getOptimizerUrl(): string {
  return process.env.OPTIMIZER_MCP_URL ?? "http://127.0.0.1:8100/mcp";
}

async function ensureSession() {
  if (!client) {
    client = MCPClient.fromDict({
      mcpServers: {
        optimizer: {
          url: getOptimizerUrl()
        }
      }
    });
  }

  if (!sessionReady) {
    await client.createSession("optimizer");
    sessionReady = true;
  }

  return client.requireSession("optimizer");
}

function extractStructured(result: Record<string, any>): Record<string, any> {
  if (result.structuredContent && typeof result.structuredContent === "object") {
    return result.structuredContent;
  }

  if (Array.isArray(result.content)) {
    const textBlock = result.content.find(
      (item: any) => item && item.type === "text" && typeof item.text === "string"
    );
    if (textBlock?.text) {
      try {
        return JSON.parse(textBlock.text);
      } catch {
        return { text: textBlock.text };
      }
    }
  }

  return result;
}

export async function callOptimizerTool(name: string, args: Record<string, unknown>) {
  const session = await ensureSession();
  const result = (await session.callTool(name, args)) as Record<string, any>;

  if (result.isError) {
    throw new Error(`Optimizer tool ${name} failed`);
  }

  return extractStructured(result);
}
