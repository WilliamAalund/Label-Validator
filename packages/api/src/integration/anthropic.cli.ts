import Anthropic from "@anthropic-ai/sdk";
import { LabelExtractionParseResult, parseLabelExtraction } from "@label-validator/shared";
import dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

// Manual CLI: pnpm --filter api apitest -- <path/to/image.jpg|png|webp>

const repoRoot = process.env.INIT_CWD ?? path.resolve(process.cwd(), "../..");
dotenv.config({ path: path.join(repoRoot, ".env") });

if (process.argv[2] === undefined) {
  console.error("Usage: pnpm --filter api apitest -- <image_path>");
  process.exit(1);
}

const imagePath = path.resolve(process.env.INIT_CWD ?? process.cwd(), process.argv[2]);
const ext = path.extname(imagePath).toLowerCase();

if (![".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
  console.error("Image must be a .jpg, .jpeg, .png, or .webp file");
  process.exit(1);
}

if (!fs.existsSync(imagePath)) {
  console.error(`Image not found: ${imagePath}`);
  process.exit(1);
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("Missing ANTHROPIC_API_KEY. Add it to .env at the repo root");
  process.exit(1);
}

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function testLabelExtraction(imagePath: string): Promise<void> {
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString("base64");
  const ext = path.extname(imagePath).toLowerCase();
  const mediaType =
    ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";

  const response = await client.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: base64Image,
            },
          },
          {
            type: "text",
            text: `You are a TTB label compliance reviewer. Extract all visible label fields from this alcohol beverage label and return them as JSON. Include: brand_name, class_type, abv, net_contents, bottler_address, government_warning. For government_warning, note whether "GOVERNMENT WARNING" appears in all caps and bold.
            
          Return only raw JSON. No markdown, no code fences, no explanation. Just the JSON object.`,
          },
        ],
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    console.error("No text response from model");
    process.exit(1);
  }

  try {
    const parsed: LabelExtractionParseResult = parseLabelExtraction(JSON.parse(textBlock.text));

    if (!parsed.success) {
      console.error("Response did not match label extraction schema:");
      console.error(JSON.stringify(parsed.error.format(), null, 2));
      process.exit(1);
    }

    console.log(JSON.stringify(parsed.data, null, 2));
  } catch {
    console.log(textBlock.text);
  }
}

void testLabelExtraction(imagePath).catch((error) => {
  console.error(error);
  process.exit(1);
});
