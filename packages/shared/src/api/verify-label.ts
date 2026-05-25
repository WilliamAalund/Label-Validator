import type { LabelExtraction } from "../schemas/label/index.js";

export const SUPPORTED_MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type SupportedMediaType = (typeof SUPPORTED_MEDIA_TYPES)[number];

export type VerifyLabelImageRequest = {
  image: string;
  mediaType: SupportedMediaType;
};

export type VerifyLabelBatchRequest = {
  labels: VerifyLabelImageRequest[];
};

/** POST /labels/verify — 200 response body */
export type VerifyLabelSuccessResponse = {
  data: LabelExtraction;
};

/** POST /labels/verify — 400 / 422 / 502 / 503 response body */
export type VerifyLabelErrorResponse = {
  error: string;
  issues?: SchemaValidationIssues;
  rawText?: string;
};

/** Zod `error.format()` shape returned on schema_error responses. */
export type SchemaValidationIssues = Record<string, unknown>;

export type VerifyLabelBatchItemResult =
  | { index: number; status: "success"; data: LabelExtraction }
  | { index: number; status: "invalid_image"; error: string }
  | {
      index: number;
      status: "schema_error";
      error: string;
      issues: SchemaValidationIssues;
      rawText: string;
    }
  | { index: number; status: "invalid_json"; error: string; rawText: string }
  | { index: number; status: "no_text"; error: string }
  | { index: number; status: "upstream_error"; error: string }
  | { index: number; status: "missing_api_key"; error: string };

export type VerifyLabelBatchResponse = {
  results: VerifyLabelBatchItemResult[];
};
