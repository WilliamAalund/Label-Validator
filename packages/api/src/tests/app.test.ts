import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../app.config.js";

describe("GET /health", () => {
  it("returns 200 for health check", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: "Health check successful" });
  });
});
