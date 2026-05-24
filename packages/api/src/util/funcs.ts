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

/** Max length for POST /labels/verify `requirements` field. */
export const MAX_REQUIREMENTS_LENGTH = 280;

/** Max images per POST /labels/verify-batch (Render free-tier demo limit). */
export const MAX_BATCH_SIZE = 5;

/** Concurrent Anthropic calls per batch request. */
export const BATCH_CONCURRENCY = 2;

export type VerifyLabelImagePayload = {
  image: string;
  mediaType: SupportedMediaType;
  requirements: string;
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

  const { image, mediaType, requirements } = body as Record<string, unknown>;

  if (typeof image !== "string" || image.trim() === "") {
    return { ok: false, error: "Field `image` is required (base64-encoded JPEG or PNG)." };
  }

  if (typeof requirements !== "string") {
    return { ok: false, error: "Field `requirements` is required (string, max 280 characters)." };
  }

  if (requirements.length > MAX_REQUIREMENTS_LENGTH) {
    return {
      ok: false,
      error: `Field \`requirements\` must be at most ${MAX_REQUIREMENTS_LENGTH} characters.`,
    };
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
    payload: { image: normalized, mediaType, requirements },
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

function buildLabelExtractionPrompt(requirements: string): string {
  const trimmed = requirements.trim();
  if (trimmed === "") {
    return LABEL_EXTRACTION_PROMPT;
  }

  return `${LABEL_EXTRACTION_PROMPT}

Additional requirements from the submitter:
${trimmed}`;
}

export async function analyzeLabel(
  imageBase64: string,
  mediaType: SupportedMediaType,
  requirements: string,
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
              text: buildLabelExtractionPrompt(requirements),
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

export type SchemaValidationIssues = ReturnType<
  Extract<LabelExtractionParseResult, { success: false }>["error"]["format"]
>;

export type VerifyLabelSuccessBody = { data: LabelExtraction };

export type VerifyLabelErrorBody =
  | { error: string }
  | { error: string; rawText: string }
  | { error: string; issues: SchemaValidationIssues; rawText: string };

export function analyzeOutcomeToResponse(
  outcome: AnalyzeLabelOutcome,
):
  | { httpStatus: 200; body: VerifyLabelSuccessBody }
  | { httpStatus: 422 | 502 | 503; body: VerifyLabelErrorBody } {
  switch (outcome.status) {
    case "success":
      return { httpStatus: 200, body: { data: outcome.data } };
    case "missing_api_key":
      return { httpStatus: 503, body: { error: "Label analysis is not configured." } };
    case "no_text":
      return { httpStatus: 502, body: { error: "Model returned no text response." } };
    case "invalid_json":
      return {
        httpStatus: 502,
        body: { error: "Model response was not valid JSON.", rawText: outcome.rawText },
      };
    case "schema_error":
      return {
        httpStatus: 422,
        body: {
          error: "Model response did not match label extraction schema.",
          issues: outcome.issues,
          rawText: outcome.rawText,
        },
      };
    case "upstream_error":
      return { httpStatus: 502, body: { error: outcome.message } };
    default: {
      const _exhaustive: never = outcome;
      return { httpStatus: 502, body: { error: "Unexpected analysis error." } };
    }
  }
}

export type VerifyLabelBatchItemResult =
  | { index: number; status: "success"; data: LabelExtraction }
  | { index: number; status: "invalid_image"; error: string }
  | { index: number; status: "schema_error"; error: string; issues: SchemaValidationIssues; rawText: string }
  | { index: number; status: "invalid_json"; error: string; rawText: string }
  | { index: number; status: "no_text"; error: string }
  | { index: number; status: "upstream_error"; error: string }
  | { index: number; status: "missing_api_key"; error: string };

export function parseVerifyLabelBatch(
  body: unknown,
):
  | { ok: true; items: VerifyLabelImagePayload[] }
  | { ok: false; error: string } {
  if (body === null || typeof body !== "object") {
    return { ok: false, error: "Request body must be a JSON object." };
  }

  const { labels } = body as Record<string, unknown>;

  if (!Array.isArray(labels)) {
    return { ok: false, error: "Field `labels` must be an array." };
  }

  if (labels.length === 0) {
    return { ok: false, error: "Field `labels` must contain at least one image." };
  }

  if (labels.length > MAX_BATCH_SIZE) {
    return {
      ok: false,
      error: `Field \`labels\` must contain at most ${MAX_BATCH_SIZE} images.`,
    };
  }

  const items: VerifyLabelImagePayload[] = [];
  for (let index = 0; index < labels.length; index++) {
    const parsed = parseVerifyLabelImage(labels[index]);
    if (!parsed.ok) {
      return {
        ok: false,
        error: `labels[${index}]: ${parsed.error}`,
      };
    }
    items.push(parsed.payload);
  }

  return { ok: true, items };
}

function analyzeOutcomeToBatchItem(
  index: number,
  outcome: AnalyzeLabelOutcome,
): VerifyLabelBatchItemResult {
  switch (outcome.status) {
    case "success":
      return { index, status: "success", data: outcome.data };
    case "missing_api_key":
      return { index, status: "missing_api_key", error: "Label analysis is not configured." };
    case "no_text":
      return { index, status: "no_text", error: "Model returned no text response." };
    case "invalid_json":
      return {
        index,
        status: "invalid_json",
        error: "Model response was not valid JSON.",
        rawText: outcome.rawText,
      };
    case "schema_error":
      return {
        index,
        status: "schema_error",
        error: "Model response did not match label extraction schema.",
        issues: outcome.issues,
        rawText: outcome.rawText,
      };
    case "upstream_error":
      return { index, status: "upstream_error", error: outcome.message };
    default: {
      const _exhaustive: never = outcome;
      return { index, status: "upstream_error", error: "Unexpected analysis error." };
    }
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) {
    return [];
  }

  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  const worker = async (): Promise<void> => {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= items.length) {
        return;
      }
      results[index] = await mapper(items[index]!, index);
    }
  };

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker(),
  );
  await Promise.all(workers);
  return results;
}

export async function verifyLabelBatch(
  items: VerifyLabelImagePayload[],
): Promise<VerifyLabelBatchItemResult[]> {
  return mapWithConcurrency(items, BATCH_CONCURRENCY, async (item, index) => {
    const outcome = await analyzeLabel(item.image, item.mediaType, item.requirements);
    return analyzeOutcomeToBatchItem(index, outcome);
  });
}
