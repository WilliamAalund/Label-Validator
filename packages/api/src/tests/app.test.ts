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
  const validImage = Buffer.from("x").toString("base64");

  const validBody = {
    image: validImage,
    mediaType: "image/jpeg" as const,
    requirements: "",
  };

  it("returns 400 when image is missing", async () => {
    const response = await request(app)
      .post("/labels/verify")
      .send({ mediaType: "image/jpeg", requirements: "" });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/image/i);
  });

  it("returns 400 when requirements is missing", async () => {
    const response = await request(app)
      .post("/labels/verify")
      .send({ image: validImage, mediaType: "image/jpeg" });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/requirements/i);
  });

  it("returns 400 when requirements is not a string", async () => {
    const response = await request(app)
      .post("/labels/verify")
      .send({ image: validImage, mediaType: "image/jpeg", requirements: 42 });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/requirements/i);
  });

  it("returns 400 when requirements exceeds 280 characters", async () => {
    const response = await request(app)
      .post("/labels/verify")
      .send({
        ...validBody,
        requirements: "a".repeat(281),
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/280/i);
  });

  it("accepts requirements up to 280 characters before analysis", async () => {
    const previous = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    const response = await request(app)
      .post("/labels/verify")
      .send({
        ...validBody,
        requirements: "a".repeat(280),
      });

    if (previous !== undefined) {
      process.env.ANTHROPIC_API_KEY = previous;
    }

    expect(response.status).toBe(503);
    expect(response.body.error).toMatch(/not configured/i);
  });

  it("returns 400 for unsupported media type", async () => {
    const response = await request(app)
      .post("/labels/verify")
      .send({ image: validImage, mediaType: "image/webp", requirements: "" });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/mediaType/i);
  });

  it("returns 400 for invalid base64", async () => {
    const response = await request(app)
      .post("/labels/verify")
      .send({ image: "!!!not-base64!!!", mediaType: "image/png", requirements: "" });

    expect(response.status).toBe(400);
  });

  it("returns 400 when image is empty", async () => {
    const response = await request(app)
      .post("/labels/verify")
      .send({ image: "   ", mediaType: "image/png", requirements: "" });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/image/i);
  });
});

describe("POST /labels/verify-batch", () => {
  const validItem = {
    image: Buffer.from("x").toString("base64"),
    mediaType: "image/jpeg" as const,
    requirements: "",
  };

  it("returns 400 when labels is missing", async () => {
    const response = await request(app).post("/labels/verify-batch").send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/labels/i);
  });

  it("returns 400 when labels is empty", async () => {
    const response = await request(app).post("/labels/verify-batch").send({ labels: [] });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/at least one/i);
  });

  it("returns 400 when more than 5 labels", async () => {
    const response = await request(app)
      .post("/labels/verify-batch")
      .send({ labels: Array.from({ length: 6 }, () => validItem) });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/at most 5/i);
  });

  it("returns 400 when a batch item is invalid", async () => {
    const response = await request(app)
      .post("/labels/verify-batch")
      .send({
        labels: [validItem, { image: "not-valid!!!", mediaType: "image/png" }],
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/labels\[1\]/i);
  });

  it("returns 503 when ANTHROPIC_API_KEY is not set", async () => {
    const previous = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;

    const response = await request(app)
      .post("/labels/verify-batch")
      .send({ labels: [validItem] });

    if (previous !== undefined) {
      process.env.ANTHROPIC_API_KEY = previous;
    }

    expect(response.status).toBe(503);
  });
});
