import { describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../src/app.js";

describe("GET /healthz", () => {
  it("returns 200", async () => {
    const res = await request(app).get("/healthz");
    expect(res.status).toBe(200);
  });
});
