import type { LabelExtractionV1 as LabelExtraction } from "./v1.js";
import type { LabelFieldDefinition } from "./fields.js";
import { LABEL_EXTRACTION_FIELD_DEFINITIONS } from "./fields.js";
import type { ExpectedLabelValues } from "./expected-values.js";
import { getExpectedValueAtPath } from "./expected-values.js";

export type LabelComplianceIssue = {
  path: string;
  label: string;
  kind: "string" | "boolean";
  expected: string | boolean;
  actual: string | boolean | null;
};

export function getExtractedValueAtPath(
  extraction: LabelExtraction,
  path: string,
): string | boolean | null | undefined {
  const parts = path.split(".");
  let current: unknown = extraction;

  for (const part of parts) {
    if (current === null || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  if (typeof current === "string" || typeof current === "boolean" || current === null) {
    return current;
  }

  return undefined;
}

function normalizeComparableString(value: string): string {
  return value.trim().toLowerCase();
}

function stringsMatch(expected: string, actual: string | null | undefined): boolean {
  return normalizeComparableString(expected) === normalizeComparableString(actual ?? "");
}

function booleansMatch(expected: boolean, actual: boolean | undefined): boolean {
  return expected === (actual ?? false);
}

function formatActualForIssue(
  kind: "string" | "boolean",
  actual: string | boolean | null | undefined,
): string | boolean | null {
  if (kind === "string") {
    return actual === undefined ? null : actual;
  }
  return actual === undefined ? false : actual;
}

export function compareExpectedToExtracted(
  extracted: LabelExtraction,
  expected: ExpectedLabelValues,
  fields: LabelFieldDefinition[] = LABEL_EXTRACTION_FIELD_DEFINITIONS,
): LabelComplianceIssue[] {
  const issues: LabelComplianceIssue[] = [];

  const visit = (defs: LabelFieldDefinition[]): void => {
    for (const field of defs) {
      if (field.kind === "group") {
        visit(field.fields);
        continue;
      }

      const expectedValue = getExpectedValueAtPath(expected, field.path);
      const actualValue = getExtractedValueAtPath(extracted, field.path);

      if (field.kind === "string") {
        if (typeof expectedValue !== "string" || expectedValue.trim() === "") {
          continue;
        }

        if (!stringsMatch(expectedValue, actualValue as string | null | undefined)) {
          issues.push({
            path: field.path,
            label: field.label,
            kind: "string",
            expected: expectedValue,
            actual: formatActualForIssue("string", actualValue as string | null | undefined),
          });
        }
        continue;
      }

      if (field.kind === "boolean") {
        const expectedBool = expectedValue === true;
        if (!booleansMatch(expectedBool, actualValue as boolean | undefined)) {
          issues.push({
            path: field.path,
            label: field.label,
            kind: "boolean",
            expected: expectedBool,
            actual: formatActualForIssue("boolean", actualValue as boolean | undefined),
          });
        }
      }
    }
  };

  visit(fields);
  return issues;
}

export function hasComparedComplianceFields(
  expected: ExpectedLabelValues,
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
        const value = getExpectedValueAtPath(expected, field.path);
        if (typeof value === "string" && value.trim() !== "") {
          return true;
        }
        continue;
      }

      if (field.kind === "boolean") {
        return true;
      }
    }
    return false;
  };

  return visit(fields);
}
