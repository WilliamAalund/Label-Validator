import { z } from "zod";
import { LabelExtractionSchemaV1 } from "./v1.js";

const SKIP_KEYS = new Set(["schema_version"]);

export type LabelFieldDefinition =
  | {
      kind: "string";
      path: string;
      key: string;
      label: string;
    }
  | {
      kind: "boolean";
      path: string;
      key: string;
      label: string;
    }
  | {
      kind: "group";
      path: string;
      key: string;
      label: string;
      fields: LabelFieldDefinition[];
    };

function humanizeKey(key: string): string {
  return key
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function unwrap(type: z.ZodTypeAny): z.ZodTypeAny {
  const typeName = type._def.typeName as string;
  if (
    typeName === "ZodOptional" ||
    typeName === "ZodNullable" ||
    typeName === "ZodDefault"
  ) {
    return unwrap(type._def.innerType as z.ZodTypeAny);
  }
  return type;
}

function isStringLikeField(type: z.ZodTypeAny): boolean {
  const unwrapped = unwrap(type);
  const typeName = unwrapped._def.typeName as string;
  if (typeName === "ZodString") {
    return true;
  }
  if (typeName === "ZodUnion") {
    const options = unwrapped._def.options as z.ZodTypeAny[];
    return options.some((option) => unwrap(option)._def.typeName === "ZodString");
  }
  return false;
}

function fieldFromZodType(
  key: string,
  type: z.ZodTypeAny,
  parentPath: string,
): LabelFieldDefinition | null {
  if (SKIP_KEYS.has(key)) {
    return null;
  }

  const path = parentPath ? `${parentPath}.${key}` : key;
  const unwrapped = unwrap(type);
  const typeName = unwrapped._def.typeName as string;

  if (typeName === "ZodObject") {
    const shape = (unwrapped as z.ZodObject<z.ZodRawShape>).shape;
    return {
      kind: "group",
      path,
      key,
      label: humanizeKey(key),
      fields: fieldsFromZodShape(shape, path),
    };
  }

  if (typeName === "ZodBoolean") {
    return {
      kind: "boolean",
      path,
      key,
      label: humanizeKey(key),
    };
  }

  if (isStringLikeField(type)) {
    return {
      kind: "string",
      path,
      key,
      label: humanizeKey(key),
    };
  }

  return null;
}

function fieldsFromZodShape(
  shape: z.ZodRawShape,
  parentPath: string,
): LabelFieldDefinition[] {
  return Object.entries(shape)
    .map(([key, fieldType]) => fieldFromZodType(key, fieldType as z.ZodTypeAny, parentPath))
    .filter((field): field is LabelFieldDefinition => field !== null);
}

/** UI field tree derived from LabelExtractionSchemaV1. */
export const LABEL_EXTRACTION_FIELD_DEFINITIONS: LabelFieldDefinition[] =
  fieldsFromZodShape(LabelExtractionSchemaV1.shape, "");
