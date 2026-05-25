import { useMemo, useState } from "react";
import type { PendingLabelFile } from "../context/LabelContext";
import {
    hasIncompleteExpectedLabel,
    type ExpectedLabelValue,
    type LabelFieldDefinition,
} from "@label-validator/shared";
import { useObjectUrl } from "../hooks/useObjectUrl";
import LabelExpectedFields from "./LabelExpectedFields";

type FileListItemProps = {
    entry: PendingLabelFile;
    fieldDefinitions: readonly LabelFieldDefinition[];
    onExpectedChange: (path: string, value: ExpectedLabelValue) => void;
    onRemove: () => void;
};

const WarningIcon = () => (
    <svg
        className="home-file-warning-icon"
        width="22"
        height="22"
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

const FileListItem = ({
    entry,
    fieldDefinitions,
    onExpectedChange,
    onRemove,
}: FileListItemProps) => {
    const previewUrl = useObjectUrl(entry.file);
    const [expanded, setExpanded] = useState(false);

    const hasIncompleteFields = useMemo(
        () => hasIncompleteExpectedLabel(entry.expected, [...fieldDefinitions]),
        [entry.expected, fieldDefinitions],
    );

    return (
        <li
            className={
                expanded
                    ? "home-upload-grid-cell home-file-item home-file-item--expanded"
                    : "home-upload-grid-cell home-file-item"
            }
        >
            <div className="home-file-item-compact">
                <div className="home-file-item-header">
                    <span className="home-file-name">{entry.file.name}</span>
                    <button
                        type="button"
                        className="home-file-remove"
                        onClick={onRemove}
                        aria-label={`Remove ${entry.file.name}`}
                    >
                        ×
                    </button>
                </div>
                {previewUrl ? (
                    <div
                        className="home-file-preview-wrap"
                        tabIndex={0}
                        aria-label={`${entry.file.name} — hover to view full image`}
                    >
                        <img
                            src={previewUrl}
                            alt={entry.file.name}
                            className="home-file-preview"
                        />
                        <div className="home-file-preview-zoom">
                            <img src={previewUrl} alt="" />
                        </div>
                    </div>
                ) : (
                    <div className="home-file-preview-placeholder" aria-hidden />
                )}
                <div className="home-file-item-actions-row">
                        <button
                            type="button"
                            className="home-file-expand"
                            aria-expanded={expanded}
                            aria-label={
                                expanded
                                    ? "Collapse requirement fields"
                                    : "Expand requirement fields"
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
                            <span className="home-file-expand-label">Requirements</span>
                        </button>
                        {hasIncompleteFields && (
                            <span
                                className="home-file-warning"
                                tabIndex={0}
                                aria-label="Some expected label fields are missing"
                            >
                                <WarningIcon />
                                <span className="home-file-warning-tooltip" role="tooltip">
                                    Expected application information is missing. Open Requirements
                                    to enter values before validating.
                                </span>
                            </span>
                        )}
                </div>
            </div>

            {expanded && (
                <div className="home-file-item-requirements">
                    <p className="home-file-requirements-title">Application Information</p>
                    <LabelExpectedFields
                        fields={[...fieldDefinitions]}
                        values={entry.expected}
                        onChange={onExpectedChange}
                    />
                </div>
            )}
        </li>
    );
};

export default FileListItem;
