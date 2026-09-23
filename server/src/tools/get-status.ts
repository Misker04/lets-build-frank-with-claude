import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(
  readFileSync(path.resolve(here, "..", "..", "package.json"), "utf-8"),
) as { version: string };

export const name = "get_status";

const outputSchema = {
  summary: z.string().describe("Human-readable one-line status summary."),
  version: z.string().describe("Frank's package version."),
  uptimeSeconds: z.number().describe("Seconds since the process started."),
  greeting: z.string().describe("A short greeting from Frank."),
};

export function register(server: McpServer): void {
  server.registerTool(
    name,
    {
      title: "Get status",
      description:
        "Returns Frank's version, uptime in seconds, and a greeting. Use this to confirm Frank is reachable and to check what build is running.",
      inputSchema: {},
      outputSchema,
    },
    async () => {
      const uptimeSeconds = Math.floor(process.uptime());
      const summary = `Frank v${pkg.version} has been up for ${uptimeSeconds}s.`;
      const result = {
        summary,
        version: pkg.version,
        uptimeSeconds,
        greeting: "Hello, I'm Frank.",
      };
      return {
        content: [{ type: "text", text: JSON.stringify(result) }],
        structuredContent: result,
      };
    },
  );
}
