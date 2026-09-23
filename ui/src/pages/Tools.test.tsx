import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Tools } from "./Tools";
import * as mcpClient from "../api/mcpClient";

describe("Tools", () => {
  it("lists tools and renders a generated form on selection", async () => {
    vi.spyOn(mcpClient, "listTools").mockResolvedValue([
      {
        name: "get_status",
        description: "Returns Frank's version, uptime, and a greeting.",
        inputSchema: { type: "object", properties: {} },
      },
    ]);

    render(<Tools />);

    await screen.findByText("get_status");
    const radio = screen.getByRole("radio");
    await userEvent.click(radio);

    expect(await screen.findByText("This tool takes no input.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Call tool" })).toBeInTheDocument();
  });
});
