import type { LabelFieldDefinition } from "./fields.js";
import { LABEL_EXTRACTION_FIELD_DEFINITIONS } from "./fields.js";

export type ExpectedLabelValue = string | boolean;
export type ExpectedLabelValues = Record<string, unknown>;

export function createEmptyExpectedLabel(
  fields: LabelFieldDefinition[] = LABEL_EXTRACTION_FIELD_DEFINITIONS,
): ExpectedLabelValues {
  const values: ExpectedLabelValues = {};

  for (const field of fields) {
    if (field.kind === "group") {
      const group: ExpectedLabelValues = {};
      for (const child of field.fields) {
        if (child.kind === "group") continue;
        group[child.key] = child.kind === "string" ? "" : false;
      }
      values[field.key] = group;
      continue;
    }

    values[field.key] = field.kind === "string" ? "" : false;
  }

  return values;
}

export function getExpectedValueAtPath(
  values: ExpectedLabelValues,
  path: string,
): ExpectedLabelValue | undefined {
  const parts = path.split(".");
  let current: unknown = values;

  for (const part of parts) {
    if (current === null || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  if (typeof current === "string" || typeof current === "boolean") {
    return current;
  }

  return undefined;
}

/** True when any string field in the schema is empty (whitespace-only counts as empty). */
export function hasIncompleteExpectedLabel(
  values: ExpectedLabelValues,
  fields: LabelFieldDefinition[] = LABEL_EXTRACTION_FIELD_DEFINITIONS,
): boolean {
  const visit = (defs: LabelFieldDefinition[]): boolean => {
    for (const field of defs) {
      if (field.kind === "group") {
        if (visit(field.fields)) {
          return true;
        }
        continue;
      }

      if (field.kind === "string") {
        const value = getExpectedValueAtPath(values, field.path);
        if (typeof value !== "string" || value.trim() === "") {
          return true;
        }
      }
    }
    return false;
  };

  return visit(fields);
}

export function setExpectedValueAtPath(
  values: ExpectedLabelValues,
  path: string,
  value: ExpectedLabelValue,
): ExpectedLabelValues {
  const parts = path.split(".");
  if (parts.length === 1) {
    return { ...values, [path]: value };
  }

  const head = parts[0];
  if (head === undefined) {
    return values;
  }

  const nested =
    typeof values[head] === "object" && values[head] !== null
      ? (values[head] as ExpectedLabelValues)
      : {};

  return {
    ...values,
    [head]: setExpectedValueAtPath(nested, parts.slice(1).join("."), value),
  };
}
