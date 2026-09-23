import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTools } from "../tools/index.js";

// A fresh McpServer per request keeps the stateless Streamable HTTP transport
// (app.ts) simple — no shared mutable state between callers.
export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "frank",
    version: "0.1.0",
  });
  registerTools(server);
  return server;
}
