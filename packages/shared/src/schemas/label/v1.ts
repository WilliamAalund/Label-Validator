import { z } from "zod";

export const LABEL_EXTRACTION_SCHEMA_VERSION = 1 as const;

const nullableString = z.union([z.string(), z.null()]);

export const GovernmentWarningSchemaV1 = z
  .object({
    text: nullableString,
    all_caps_header: z.boolean().optional(),
    bold_header: z.boolean().optional(),
  })
  .passthrough();

export const LabelExtractionSchemaV1 = z
  .object({
    schema_version: z.literal(LABEL_EXTRACTION_SCHEMA_VERSION).optional(),
    brand_name: nullableString,
    class_type: nullableString,
    abv: nullableString,
    net_contents: nullableString,
    bottler_address: nullableString,
    government_warning: GovernmentWarningSchemaV1,
  })
  .passthrough();

export type GovernmentWarningV1 = z.infer<typeof GovernmentWarningSchemaV1>;
export type LabelExtractionV1 = z.infer<typeof LabelExtractionSchemaV1>;
