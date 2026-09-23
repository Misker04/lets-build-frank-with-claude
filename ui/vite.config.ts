/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Served by Frank at / (ADR-006 amends ADR-003: no VITE_FRANK_URL, no CORS —
// the console and the MCP endpoint share an origin), so base stays "/".
export default defineConfig({
  base: "/",
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
});
