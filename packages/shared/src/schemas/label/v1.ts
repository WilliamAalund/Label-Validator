import { z } from "zod";

export const LABEL_EXTRACTION_SCHEMA_VERSION = 1 as const;

export const GovernmentWarningSchemaV1 = z
  .object({
    text: z.string(),
    all_caps_header: z.boolean(),
    bold_header: z.boolean(),
  })
  .passthrough();

export const LabelExtractionSchemaV1 = z
  .object({
    schema_version: z.literal(LABEL_EXTRACTION_SCHEMA_VERSION).optional(),
    brand_name: z.string(),
    class_type: z.string(),
    abv: z.string(),
    net_contents: z.string(),
    bottler_address: z.string(),
    government_warning: GovernmentWarningSchemaV1,
  })
  .passthrough();

export type GovernmentWarningV1 = z.infer<typeof GovernmentWarningSchemaV1>;
export type LabelExtractionV1 = z.infer<typeof LabelExtractionSchemaV1>;
