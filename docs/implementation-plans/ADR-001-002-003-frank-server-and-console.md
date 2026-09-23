# Implementation plan: ADR-001, ADR-002, ADR-003 — Frank's server and console

**Status:** Implemented
**Covers:** [ADR-001](../adr/ADR-001-mcp-server-stack.md), [ADR-002](../adr/ADR-002-mcp-tool-conventions.md), [ADR-003](../adr/ADR-003-cloudscape-ui.md)

## Context

`server/` and `ui/` started as `.gitkeep`-only stubs — the fresh-fork state
the course begins from. The pipeline (`.github/workflows/deploy.yml`,
`Dockerfile`) and the class skill file
(`.claude/skills/frank-tools/SKILL.md`) already assume the shape these ADRs
describe, and start doing real work the moment `server/package-lock.json` /
`ui/package-lock.json` exist — nothing in CI or the Dockerfile needed to
change.

This plan built:
- **ADR-001** — Frank's MCP server: TypeScript, official `@modelcontextprotocol/sdk`, Streamable HTTP, Express, zod.
- **ADR-002** — tool naming/schema/read-only conventions, and the first tool, `get_status`.
- **ADR-003** — the Cloudscape console (React + Vite), served by Frank at `/` and calling `/mcp` relatively, per ADR-006's amendment (no `VITE_FRANK_URL`, no CORS).

Both packages independently satisfy the Dockerfile's build contract:
`server-build` stage runs `npm ci` (from `server/package.json` +
`package-lock.json` alone) then, after the full source is copied,
`npm test && npm run build` → `server/dist`. `ui-build` runs
`npm ci && npm test && npm run build` → `ui/dist`, tolerating an absent
`ui/` (already handled). Runtime copies `server/dist` → `/app/dist` and
`ui/dist` → `/app/public`, and `config.ts` resolves the console at
`<package root>/public`. `PORT` defaults to `3000` (`ENV PORT=3000` in the
Dockerfile, `--target-port 3000` in `deploy.yml`).

## server/ (ADR-001, ADR-002)

**Package setup**
- `server/package.json` — scripts `dev` (watch mode), `build` (`tsc`), `test` (`vitest run`), `start` (`node dist/index.js`).
- Deps: `express`, `@modelcontextprotocol/sdk`, `zod`.
- Dev deps: `typescript`, `tsx`, `vitest`, `supertest`, `@types/express`, `@types/node`, `@types/supertest`.
- `server/tsconfig.json` — `NodeNext` module/resolution, `outDir: dist`, `rootDir: src`.

**Source layout**
- `server/src/config.ts` — reads `PORT` (default 3000) from env; resolves `publicDir = path.resolve(__dirname, '..', 'public')` (matches the Dockerfile's comment on where the built console lands).
- `server/src/mcp/server.ts` — builds the `McpServer` instance from the SDK and registers every tool from `src/tools/index.ts`.
- `server/src/tools/get-status.ts` — the first tool (ADR-002): `get_status`, no input, zod schema `{}`, returns `{ summary, version, uptimeSeconds, greeting }`. Version comes from `server/package.json`; uptime from `process.uptime()`.
- `server/src/tools/index.ts` — single registration point; every tool module registers itself here. This is also where a conventions check is easiest to enforce (see tests).
- `server/src/app.ts` — the Express app:
  - `GET /healthz` → 200 plain response, for the container probe and the Dockerfile `HEALTHCHECK`.
  - `POST /mcp` → wires a `StreamableHTTPServerTransport` from the SDK in **stateless mode** (`sessionIdGenerator: undefined`, a fresh transport per request) — the simplest correct option for a course, avoiding session-id bookkeeping.
  - Serves static files from `config.publicDir` if it exists; if not (server built before the console), responds at `/` with a plain message saying the console isn't built yet — mirrors the Dockerfile comment that `app.ts` already tolerates an absent console.
- `server/src/index.ts` — imports `app`, listens on `config.port`.

**Tests (`server/test/`)**
- `healthz.test.ts` — `GET /healthz` returns 200 (via `supertest` against the exported app).
- `get-status.test.ts` — calling the tool through the MCP transport returns a summary, version, and uptime, and `isError` is absent.
- `conventions.test.ts` — every registered tool name matches `^(get|list|search|summarize)_[a-z_]+$`, per ADR-002's closed verb set and the skill file's instruction to add a conventions test when a new verb is introduced.

## ui/ (ADR-003, as amended by ADR-006)

**Package setup**
- `ui/package.json` — scripts `dev`, `build` (`tsc --noEmit && vite build`), `test` (`vitest run`), `preview`.
- Deps: `react`, `react-dom`, `@cloudscape-design/components`, `@cloudscape-design/global-styles`.
- Dev deps: `vite`, `@vitejs/plugin-react`, `typescript`, `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@modelcontextprotocol/sdk` (used client-side too, so the UI never hand-rolls the JSON-RPC protocol — consistent with ADR-001's "no hand-rolled protocol code").
- `ui/vite.config.ts` — React plugin, `base: '/'` (served at root by Frank, per ADR-006), vitest `environment: 'jsdom'`.

**Source layout**
- `ui/src/main.tsx` — mounts `<App />`, imports Cloudscape global styles.
- `ui/src/api/mcpClient.ts` — a small wrapper around the SDK's `Client` + `StreamableHTTPClientTransport`, pointed at the **relative** URL `/mcp` (no `VITE_FRANK_URL`, no CORS — ADR-006's amendment to ADR-003). Exposes `listTools()` and `callTool(name, args)`.
- `ui/src/App.tsx` — Cloudscape `AppLayout` with top/side navigation switching between two pages by local state (no router dependency needed for two pages).
- `ui/src/pages/Overview.tsx` — calls `get_status` on mount; renders the result plus a Cloudscape `StatusIndicator` for connection health (loading / success / error).
- `ui/src/pages/Tools.tsx` — calls `listTools()` on mount, renders them in a Cloudscape `Table`; selecting a row renders `<DynamicToolForm>` built from that tool's input JSON schema, and shows the JSON result of `callTool()` after submit.
- `ui/src/components/DynamicToolForm.tsx` — walks a JSON-schema object's properties (string/number/boolean/enum — the only shapes ADR-002 tools will need for a while) and renders Cloudscape `FormField`/`Input`/`Checkbox`/`Select` per field. This is the concrete payoff ADR-003 calls out: new tools appear in the UI with zero UI work.

**Tests (`ui/src/**/*.test.tsx`, via vitest + Testing Library)**
- `Overview.test.tsx` — renders the status data returned by a mocked `mcpClient`.
- `Tools.test.tsx` — renders the tool list from a mocked `listTools()`, and that selecting a tool renders the generated form.

## Verification

1. `cd server && npm ci && npm test && npm run build` — passes, produces `dist/index.js`.
2. `cd ui && npm ci && npm test && npm run build` — passes, produces `dist/`.
3. `docker build -t frank .` from the repo root — both build stages succeed (this is the real gate per the Dockerfile's comments: "on main this image build is the single build AND the test gate").
4. `docker run -p 3000:3000 frank`, then:
   - `curl http://localhost:3000/healthz` → 200.
   - Open `http://localhost:3000/` → Cloudscape console loads, Overview shows Frank's status, Tools lists `get_status` and can invoke it.
5. Point Claude Code at it locally (`claude mcp add --transport http frank http://localhost:3000/mcp`) and confirm `get_status` is discoverable and callable.

All five steps above were run against the actual build during implementation
and passed.

Not in scope here: ADR-004/005/006/010 deployment mechanics (already
implemented in `Dockerfile`/`deploy.yml`) and ADR-008/009 (not yet written).

## Known follow-up

`npm audit` flags moderate/high vulnerabilities in `vite`/`esbuild`/
`@vitest/mocker`'s **dev server** (not runtime/production code) in both
packages. Fixing them means a breaking `vitest@5` upgrade — left alone here
as out of scope for these ADRs, worth revisiting before the class ships this
as the starting point.
