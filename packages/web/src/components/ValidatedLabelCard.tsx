import {
    getExtractedValueAtPath,
    hasIncompleteExpectedLabel,
    LABEL_EXTRACTION_FIELD_DEFINITIONS,
    type LabelFieldDefinition,
} from "@label-validator/shared";
import { useMemo, useState } from "react";
import type { LabelValidationResult } from "../context/LabelContext";
import { useObjectUrl } from "../hooks/useObjectUrl";

type ValidatedLabelCardProps = {
    result: LabelValidationResult;
};

type ComplianceBadgeStatus = "compliant" | "issues" | "incomplete";

const WarningIcon = () => (
    <svg
        className="home-validated-badge-icon"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
    >
        <path
            d="M12 3L2 20h20L12 3z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
        />
        <path d="M12 9v5M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

const CheckIcon = () => (
    <svg
        className="home-validated-badge-icon"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
    >
        <path
            d="M5 12l4 4L19 6"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

const IssueIcon = () => (
    <svg
        className="home-validated-badge-icon"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
    >
        <path
            d="M6 6l12 12M18 6L6 18"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
        />
    </svg>
);

type ComplianceBadgeProps = {
    status: ComplianceBadgeStatus;
    issueCount: number;
};

const ComplianceBadge = ({ status, issueCount }: ComplianceBadgeProps) => {
    if (status === "incomplete") {
        return (
            <span
                className="home-validated-badge home-validated-badge--incomplete"
                tabIndex={0}
                aria-label="No issues found, but application requirements were incomplete"
            >
                <WarningIcon />
                <span className="home-validated-badge-tooltip" role="tooltip">
                    AI analysis found no issues, but application requirements were missing.
                </span>
            </span>
        );
    }

    if (status === "compliant") {
        return (
            <span
                className="home-validated-badge home-validated-badge--compliant"
                tabIndex={0}
                aria-label="Label is compliant with application requirements"
            >
                <CheckIcon />
                <img src="/ai.svg" alt="" className="home-validated-badge-ai" width={14} height={14} aria-hidden />
                <span className="home-validated-badge-tooltip" role="tooltip">
                    AI analysis found that all application requirements match the label text.
                </span>
            </span>
        );
    }

    const countLabel = issueCount === 1 ? "1 issue" : `${issueCount} issues`;

    return (
        <span
            className="home-validated-badge home-validated-badge--issues"
            tabIndex={0}
            aria-label={`${countLabel} — label does not match application requirements`}
        >
            <IssueIcon />
            <span className="home-validated-badge-count" aria-hidden>
                {issueCount}
            </span>
            <span className="home-validated-badge-tooltip" role="tooltip">
                AI analysis found that {issueCount} field{issueCount === 1 ? " value" : " values"} do not
                match application requirements.
            </span>
        </span>
    );
};

function formatExtractedValue(value: string | boolean | null | undefined): string {
    if (value === null || value === undefined) {
        return "—";
    }
    if (typeof value === "boolean") {
        return value ? "Yes" : "No";
    }
    return value.trim() === "" ? "—" : value;
}

function formatExpectedValue(value: string | boolean): string {
    if (typeof value === "boolean") {
        return value ? "Yes" : "No";
    }
    return value;
}

function fieldRows(fields: readonly LabelFieldDefinition[]): LabelFieldDefinition[] {
    const rows: LabelFieldDefinition[] = [];
    for (const field of fields) {
        if (field.kind === "group") {
            rows.push(...fieldRows(field.fields));
            continue;
        }
        rows.push(field);
    }
    return rows;
}

const ValidatedLabelCard = ({ result }: ValidatedLabelCardProps) => {
    const previewUrl = useObjectUrl(result.file);
    const [expanded, setExpanded] = useState(false);

    const issueByPath = useMemo(
        () => new Map(result.complianceIssues.map((issue) => [issue.path, issue])),
        [result.complianceIssues],
    );

    const hasIncompleteRequirements = useMemo(
        () => hasIncompleteExpectedLabel(result.expected),
        [result.expected],
    );

    const displayFields = useMemo(() => fieldRows(LABEL_EXTRACTION_FIELD_DEFINITIONS), []);

    const badgeStatus: ComplianceBadgeStatus = useMemo(() => {
        if (result.complianceIssues.length > 0) {
            return "issues";
        }
        if (hasIncompleteRequirements) {
            return "incomplete";
        }
        return "compliant";
    }, [hasIncompleteRequirements, result.complianceIssues.length]);

    const showIncompleteWarning =
        hasIncompleteRequirements && result.complianceIssues.length === 0;

    const preview = previewUrl ? (
        <div
            className="home-file-preview-wrap"
            tabIndex={0}
            aria-label={`${result.fileName} — hover to view full image`}
        >
            <img src={previewUrl} alt={result.fileName} className="home-file-preview" />
            <div className="home-file-preview-zoom">
                <img src={previewUrl} alt="" />
            </div>
        </div>
    ) : (
        <div className="home-file-preview-placeholder" aria-hidden />
    );

    return (
        <li
            className={
                expanded
                    ? "home-upload-grid-cell home-validated-item home-validated-item--expanded"
                    : badgeStatus === "issues"
                      ? "home-upload-grid-cell home-validated-item home-validated-item--issues"
                      : badgeStatus === "incomplete"
                        ? "home-upload-grid-cell home-validated-item home-validated-item--incomplete"
                        : "home-upload-grid-cell home-validated-item"
            }
        >
            <div className="home-file-item-header">
                <span className="home-file-name">{result.fileName}</span>
                <ComplianceBadge status={badgeStatus} issueCount={result.complianceIssues.length} />
            </div>

            <div className="home-grid-card-body">
                <div className="home-grid-card-media">
                    {preview}
                    <div className="home-file-item-actions-row">
                        <button
                            type="button"
                            className="home-file-expand"
                            aria-expanded={expanded}
                            aria-label={
                                expanded ? "Collapse validation results" : "Expand validation results"
                            }
                            onClick={() => setExpanded((open) => !open)}
                        >
                            <span
                                className={
                                    expanded
                                        ? "home-file-expand-icon home-file-expand-icon--open"
                                        : "home-file-expand-icon"
                                }
                                aria-hidden
                            />
                            <span className="home-file-expand-label">Results</span>
                        </button>
                    </div>
                </div>

                {expanded && (
                    <div className="home-grid-card-panel home-validated-item-results">
                        <p className="home-validated-results-title">Validation Results</p>
                        {showIncompleteWarning && (
                            <p className="home-validated-status home-validated-status--warning" role="status">
                                AI analysis found no issues, but application requirements were missing.
                            </p>
                        )}
                        <dl className="home-result-fields home-validated-fields">
                            {displayFields.map((field) => {
                                if (field.kind === "group") {
                                    return null;
                                }

                                const extracted = getExtractedValueAtPath(result.data, field.path);
                                const issue = issueByPath.get(field.path);

                                return (
                                    <div
                                        key={field.path}
                                        className={
                                            issue
                                                ? "home-validated-field home-validated-field--issue"
                                                : "home-validated-field"
                                        }
                                    >
                                        <dt>{field.label}</dt>
                                        <dd>{formatExtractedValue(extracted)}</dd>
                                        {issue && (
                                            <p className="home-validated-field-note">
                                                Expected {formatExpectedValue(issue.expected)}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </dl>
                    </div>
                )}
            </div>
        </li>
    );
};

export default ValidatedLabelCard;
