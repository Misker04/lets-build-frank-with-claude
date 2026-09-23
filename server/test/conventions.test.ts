import { describe, expect, it } from "vitest";
import { ALLOWED_VERBS, toolNames } from "../src/tools/index.js";

// ADR-002: verb_noun, lower snake_case, verb from a closed set.
describe("tool naming conventions", () => {
  const pattern = new RegExp(`^(${ALLOWED_VERBS.join("|")})_[a-z][a-z_]*$`);

  it("has at least one registered tool", () => {
    expect(toolNames.length).toBeGreaterThan(0);
  });

  for (const toolName of toolNames) {
    it(`"${toolName}" matches verb_noun with an allowed verb`, () => {
      expect(toolName).toMatch(pattern);
    });
  }
});
