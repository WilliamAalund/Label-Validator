import { z } from "zod";
import { LabelExtractionSchemaV1, type LabelExtractionV1 } from "./v1.js";

export {
  LABEL_EXTRACTION_SCHEMA_VERSION,
  GovernmentWarningSchemaV1,
  LabelExtractionSchemaV1,
  type GovernmentWarningV1,
  type LabelExtractionV1,
} from "./v1.js";

/** Alias to the latest label extraction schema. Bump when adding v2, v3, etc. */
export const LabelExtractionSchema = LabelExtractionSchemaV1;
export type LabelExtraction = LabelExtractionV1;

export type LabelExtractionParseResult = z.SafeParseReturnType<
  unknown,
  LabelExtraction
>;

export {
  LABEL_EXTRACTION_FIELD_DEFINITIONS,
  type LabelFieldDefinition,
} from "./fields.js";

export {
  createEmptyExpectedLabel,
  getExpectedValueAtPath,
  hasIncompleteExpectedLabel,
  setExpectedValueAtPath,
  type ExpectedLabelValue,
  type ExpectedLabelValues,
} from "./expected-values.js";

export function parseLabelExtraction(data: unknown): LabelExtractionParseResult {
  return LabelExtractionSchema.safeParse(data);
}
