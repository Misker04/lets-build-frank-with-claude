import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { CallToolResult, Tool } from "@modelcontextprotocol/sdk/types.js";

// Relative URL: the console is served by Frank at / and talks to /mcp on the
// same origin (ADR-006 amends ADR-003 — no VITE_FRANK_URL, no CORS).
const MCP_URL = new URL("/mcp", window.location.origin);

let clientPromise: Promise<Client> | null = null;

function connect(): Promise<Client> {
  if (!clientPromise) {
    clientPromise = (async () => {
      const client = new Client({ name: "frank-console", version: "0.1.0" });
      const transport = new StreamableHTTPClientTransport(MCP_URL);
      await client.connect(transport);
      return client;
    })().catch((error) => {
      // Let the next call retry instead of caching a rejected connection.
      clientPromise = null;
      throw error;
    });
  }
  return clientPromise;
}

export async function listTools(): Promise<Tool[]> {
  const client = await connect();
  const { tools } = await client.listTools();
  return tools;
}

export async function callTool(
  name: string,
  args: Record<string, unknown>,
): Promise<CallToolResult> {
  const client = await connect();
  return client.callTool({ name, arguments: args }) as Promise<CallToolResult>;
}
