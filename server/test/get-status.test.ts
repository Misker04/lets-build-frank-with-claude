import { describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createMcpServer } from "../src/mcp/server.js";

// Talks to a real McpServer over the SDK's protocol layer (client <-> server),
// just over an in-memory transport instead of Streamable HTTP — this exercises
// tool registration, schema validation, and the handler, without the
// HTTP/SSE plumbing that Streamable HTTP adds on top.
async function connectedClient() {
  const server = createMcpServer();
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test-client", version: "0.0.0" });
  await Promise.all([
    client.connect(clientTransport),
    server.connect(serverTransport),
  ]);
  return client;
}

describe("get_status", () => {
  it("returns a summary, version, and uptime, with no error", async () => {
    const client = await connectedClient();
    const result = await client.callTool({ name: "get_status", arguments: {} });

    expect(result.isError).toBeFalsy();
    const structured = result.structuredContent as {
      summary: string;
      version: string;
      uptimeSeconds: number;
      greeting: string;
    };
    expect(structured.summary).toContain("Frank");
    expect(typeof structured.version).toBe("string");
    expect(structured.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });
});
