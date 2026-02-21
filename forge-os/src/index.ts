import { MCPServer } from "mcp-use/server";
import { createState } from "./state/store.js";
import { registerAllTools } from "./tools/register.js";

const server = new MCPServer({
  name: "forge-os",
  title: "forge-os",
  version: "0.1.0",
  description: "Demo-first MCP workspace app",
  baseUrl: process.env.MCP_URL || "http://localhost:3000",
  favicon: "icon.svg",
  websiteUrl: "https://manufact.com",
  icons: [
    {
      src: "icon.svg",
      mimeType: "image/svg+xml",
      sizes: ["512x512"]
    }
  ]
});

const state = createState();
registerAllTools(server, state);

server.listen().then(() => {
  console.log("forge-os server running");
});
