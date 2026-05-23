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

describe("POST /verify-label", () => {
  it("returns 400 when image is missing", async () => {
    const response = await request(app)
      .post("/verify-label")
      .send({ mediaType: "image/jpeg" });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/image/i);
  });

  it("returns 400 for unsupported media type", async () => {
    const response = await request(app)
      .post("/verify-label")
      .send({ image: Buffer.from("x").toString("base64"), mediaType: "image/webp" });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/mediaType/i);
  });

  it("returns 400 for invalid base64", async () => {
    const response = await request(app)
      .post("/verify-label")
      .send({ image: "!!!not-base64!!!", mediaType: "image/png" });

    expect(response.status).toBe(400);
  });

  it("accepts a data URL in the image field", async () => {
    const pixel = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64",
    );
    const response = await request(app)
      .post("/verify-label")
      .send({
        image: `data:image/png;base64,${pixel.toString("base64")}`,
        mediaType: "image/png",
      });

    expect(response.status).not.toBe(400);
  });
});
