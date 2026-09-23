import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Overview } from "./Overview";
import * as mcpClient from "../api/mcpClient";

describe("Overview", () => {
  it("renders the status returned by get_status", async () => {
    vi.spyOn(mcpClient, "callTool").mockResolvedValue({
      content: [],
      structuredContent: {
        summary: "Frank v0.1.0 has been up for 5s.",
        version: "0.1.0",
        uptimeSeconds: 5,
        greeting: "Hello, I'm Frank.",
      },
    });

    render(<Overview />);

    expect(await screen.findByText("Connected")).toBeInTheDocument();
    expect(await screen.findByText("Frank v0.1.0 has been up for 5s.")).toBeInTheDocument();
  });

  it("shows an error state when the call fails", async () => {
    vi.spyOn(mcpClient, "callTool").mockRejectedValue(new Error("network down"));

    render(<Overview />);

    expect(await screen.findByText("Not connected")).toBeInTheDocument();
    expect(await screen.findByText("network down")).toBeInTheDocument();
  });
});
