import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
// This file lives in <package root>/src (dev) or <package root>/dist (built),
// so the package root is always one level up.
const packageRoot = path.resolve(here, "..");

// The Dockerfile copies the built console to /app/public, next to /app/dist
// (ADR-006). Locally, before the console is built or copied, this simply
// will not exist — app.ts handles that.
const publicDir = path.join(packageRoot, "public");

export const config = {
  port: Number(process.env.PORT) || 3000,
  publicDir,
  hasConsole: existsSync(publicDir),
};
