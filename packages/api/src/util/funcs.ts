import Anthropic from "@anthropic-ai/sdk";
import {
  type LabelExtraction,
  type LabelExtractionParseResult,
  parseLabelExtraction,
} from "@label-validator/shared";

export const SUPPORTED_MEDIA_TYPES = ["image/jpeg", "image/png"] as const;
export type SupportedMediaType = (typeof SUPPORTED_MEDIA_TYPES)[number];

/** Decoded image size limit (client should compress before upload). */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export type VerifyLabelImagePayload = {
  image: string;
  mediaType: SupportedMediaType;
};

const LABEL_EXTRACTION_PROMPT = `You are a TTB label compliance reviewer. Extract all visible label fields from this alcohol beverage label and return them as JSON. Include: brand_name, class_type, abv, net_contents, bottler_address, government_warning. For government_warning, note whether "GOVERNMENT WARNING" appears in all caps and bold.

Return only raw JSON. No markdown, no code fences, no explanation. Just the JSON object.`;

function isSupportedMediaType(value: unknown): value is SupportedMediaType {
  return (
    typeof value === "string" &&
    (SUPPORTED_MEDIA_TYPES as readonly string[]).includes(value)
  );
}

/** Accepts raw base64 or a data URL from the client (\`data:image/jpeg;base64,...\`). */
export function normalizeBase64Image(image: string): string {
  const dataUrlMatch = /^data:image\/(jpeg|png);base64,(.+)$/i.exec(image.trim());
  if (dataUrlMatch?.[1]) {
    return dataUrlMatch[1];
  }
  return image.trim();
}

export function parseVerifyLabelImage(
  body: unknown,
): { ok: true; payload: VerifyLabelImagePayload } | { ok: false; error: string } {
  if (body === null || typeof body !== "object") {
    return { ok: false, error: "Request body must be a JSON object." };
  }

  const { image, mediaType } = body as Record<string, unknown>;

  if (typeof image !== "string" || image.trim() === "") {
    return { ok: false, error: "Field `image` is required (base64-encoded JPEG or PNG)." };
  }

  if (!isSupportedMediaType(mediaType)) {
    return {
      ok: false,
      error: `Field \`mediaType\` must be one of: ${SUPPORTED_MEDIA_TYPES.join(", ")}.`,
    };
  }

  const normalized = normalizeBase64Image(image);
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(normalized)) {
    return { ok: false, error: "Field `image` must be valid base64." };
  }

  const decoded = Buffer.from(normalized, "base64");
  if (decoded.length === 0) {
    return { ok: false, error: "Field `image` must be valid base64." };
  }

  if (decoded.length > MAX_IMAGE_BYTES) {
    return {
      ok: false,
      error: `Image exceeds maximum size of ${MAX_IMAGE_BYTES} bytes after decoding.`,
    };
  }

  return {
    ok: true,
    payload: { image: normalized, mediaType },
  };
}

export type AnalyzeLabelOutcome =
  | { status: "success"; data: LabelExtraction }
  | {
      status: "schema_error";
      issues: ReturnType<
        Extract<LabelExtractionParseResult, { success: false }>["error"]["format"]
      >;
      rawText: string;
    }
  | { status: "invalid_json"; rawText: string }
  | { status: "no_text" }
  | { status: "missing_api_key" }
  | { status: "upstream_error"; message: string };

function getAnthropicClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new Anthropic({ apiKey });
}

export async function analyzeLabel(
  imageBase64: string,
  mediaType: SupportedMediaType,
): Promise<AnalyzeLabelOutcome> {
  const client = getAnthropicClient();
  if (!client) {
    return { status: "missing_api_key" };
  }

  let response: Awaited<ReturnType<Anthropic["messages"]["create"]>>;
  try {
    response = await client.messages.create({
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
                data: imageBase64,
              },
            },
            {
              type: "text",
              text: LABEL_EXTRACTION_PROMPT,
            },
          ],
        },
      ],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Anthropic API request failed.";
    return { status: "upstream_error", message };
  }

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return { status: "no_text" };
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(textBlock.text);
  } catch {
    return { status: "invalid_json", rawText: textBlock.text };
  }

  const parseResult = parseLabelExtraction(parsedJson);
  if (!parseResult.success) {
    return {
      status: "schema_error",
      issues: parseResult.error.format(),
      rawText: textBlock.text,
    };
  }

  return { status: "success", data: parseResult.data };
}
