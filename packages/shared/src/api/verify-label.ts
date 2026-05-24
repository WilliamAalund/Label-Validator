import type { LabelExtraction } from "../schemas/label/index.js";

export type SupportedMediaType = "image/jpeg" | "image/png";

export type VerifyLabelImageRequest = {
  image: string;
  mediaType: SupportedMediaType;
};

export type VerifyLabelBatchRequest = {
  labels: VerifyLabelImageRequest[];
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
