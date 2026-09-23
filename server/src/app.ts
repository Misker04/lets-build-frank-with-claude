import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { config } from "./config.js";
import { createMcpServer } from "./mcp/server.js";

export const app = express();

app.get("/healthz", (_req, res) => {
  res.status(200).send("ok");
});

app.post("/mcp", express.json(), async (req, res) => {
  // Stateless: a fresh server + transport per request. Simpler than session
  // bookkeeping, and Frank has no per-caller state to keep anyway (ADR-002,
  // read-only).
  const server = createMcpServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  res.on("close", () => {
    transport.close();
    server.close();
  });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      });
    }
    // eslint-disable-next-line no-console
    console.error("MCP request failed:", error);
  }
});

// No sessions exist in stateless mode, so GET (server-initiated streams) and
// DELETE (session teardown) are not meaningful here.
app.get("/mcp", (_req, res) => {
  res.status(405).json({
    jsonrpc: "2.0",
    error: { code: -32000, message: "Method not allowed." },
    id: null,
  });
});
app.delete("/mcp", (_req, res) => {
  res.status(405).json({
    jsonrpc: "2.0",
    error: { code: -32000, message: "Method not allowed." },
    id: null,
  });
});

if (config.hasConsole) {
  app.use(express.static(config.publicDir));
} else {
  app.get("/", (_req, res) => {
    res.status(200).send("Frank is running. The console has not been built yet (ADR-003).");
  });
}
