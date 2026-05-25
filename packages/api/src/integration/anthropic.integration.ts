import * as fs from "node:fs";
import * as path from "node:path";
import dotenv from "dotenv";
import request from "supertest";
import app from "../app.config.js";
import {
  analyzeLabel,
  parseVerifyLabelImage,
  type SupportedMediaType,
} from "../util/funcs.js";

// Run: pnpm --filter api test:integration -- <path/to/label.jpg|png|webp>

const repoRoot = process.env.INIT_CWD ?? path.resolve(process.cwd(), "../..");
dotenv.config({ path: path.join(repoRoot, ".env") });

const SUPPORTED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

function resolveImagePath(arg: string): string {
  const base = process.env.INIT_CWD ?? process.cwd();
  return path.resolve(base, arg);
}

function loadImagePayload(imagePath: string): {
  imagePath: string;
  mediaType: SupportedMediaType;
  body: { image: string; mediaType: SupportedMediaType };
} {
  const ext = path.extname(imagePath).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.has(ext)) {
    throw new Error(`Image must be a .jpg, .jpeg, .png, or .webp file: ${imagePath}`);
  }

  if (!fs.existsSync(imagePath)) {
    throw new Error(`Image not found: ${imagePath}`);
  }

  const mediaType: SupportedMediaType =
    ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
  const image = fs.readFileSync(imagePath).toString("base64");

  return {
    imagePath,
    mediaType,
    body: { image, mediaType },
  };
}

function fail(step: string, detail: unknown): never {
  console.error(`\n[${step}] failed`);
  console.error(detail);
  process.exit(1);
}

async function main(): Promise<void> {
  if (process.argv[2] === undefined) {
    console.error("Usage: pnpm --filter api test:integration -- <image_path>");
    process.exit(1);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Missing ANTHROPIC_API_KEY. Add it to .env at the repo root.");
    process.exit(1);
  }

  const { imagePath, body: payload } = loadImagePayload(resolveImagePath(process.argv[2]));

  console.log(`\nImage: ${imagePath}\n`);

  const parsed = parseVerifyLabelImage(payload);
  if (!parsed.ok) {
    fail("parseVerifyLabelImage", parsed.error);
  }

  console.log("[parseVerifyLabelImage] ok");

  const outcome = await analyzeLabel(parsed.payload.image, parsed.payload.mediaType);
  if (outcome.status !== "success") {
    fail("analyzeLabel", outcome);
  }

  console.log("[analyzeLabel]");
  console.log(JSON.stringify(outcome.data, null, 2));

  const response = await request(app).post("/labels/verify").send(payload);
  if (response.status !== 200) {
    fail("POST /labels/verify", { status: response.status, body: response.body });
  }

  console.log("\n[POST /labels/verify]");
  console.log(JSON.stringify(response.body.data, null, 2));
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
