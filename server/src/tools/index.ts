import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as getStatus from "./get-status.js";

// One module per tool (ADR-002). Add new tools here.
const tools = [getStatus];

// The closed verb set from ADR-002. Exported so tests can check every
// registered tool's name without duplicating the rule.
export const ALLOWED_VERBS = ["get", "list", "search", "summarize"] as const;

export const toolNames = tools.map((tool) => tool.name);

export function registerTools(server: McpServer): void {
  for (const tool of tools) {
    tool.register(server);
  }
}
