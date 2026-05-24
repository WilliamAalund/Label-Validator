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

describe("POST /labels/verify", () => {
  it("returns 400 when image is missing", async () => {
    const response = await request(app)
      .post("/labels/verify")
      .send({ mediaType: "image/jpeg" });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/image/i);
  });

  it("returns 400 for unsupported media type", async () => {
    const response = await request(app)
      .post("/labels/verify")
      .send({ image: Buffer.from("x").toString("base64"), mediaType: "image/webp" });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/mediaType/i);
  });

  it("returns 400 for invalid base64", async () => {
    const response = await request(app)
      .post("/labels/verify")
      .send({ image: "!!!not-base64!!!", mediaType: "image/png" });

    expect(response.status).toBe(400);
  });

  it("returns 400 when image is empty", async () => {
    const response = await request(app)
      .post("/labels/verify")
      .send({ image: "   ", mediaType: "image/png" });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/image/i);
  });
});
