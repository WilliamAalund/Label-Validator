import type {
    ExpectedLabelValue,
    ExpectedLabelValues,
    LabelComplianceIssue,
    LabelExtraction,
    LabelFieldDefinition,
} from "@label-validator/shared";
import { createContext, type ChangeEvent, type RefObject } from "react";

export const MAX_LABEL_FILES = 5 as const;

export type PendingLabelFile = {
    id: string;
    file: File;
    expected: ExpectedLabelValues;
};

export type LabelValidationResult = {
    id: string;
    file: File;
    fileName: string;
    expected: ExpectedLabelValues;
    data: LabelExtraction;
    complianceIssues: LabelComplianceIssue[];
};

export type LabelContextType = {
    maxFiles: typeof MAX_LABEL_FILES;
    labelFieldDefinitions: readonly LabelFieldDefinition[];
    pendingFiles: PendingLabelFile[];
    remainingSlots: number;
    atMaxFiles: boolean;
    canSubmit: boolean;
    addMorePrompt: string | null;
    error: string | null;
    setError: (error: string | null) => void;
    validationResults: LabelValidationResult[];
    isSubmitting: boolean;

    addFiles: (files: File[]) => void;
    updateExpectedValue: (id: string, path: string, value: ExpectedLabelValue) => void;
    removeFile: (id: string) => void;
    clearFiles: () => void;
    addFilesFromInput: (event: ChangeEvent<HTMLInputElement>) => void;
    addFilesFromDataTransfer: (dataTransfer: DataTransfer) => Promise<void>;
    submitFiles: () => Promise<void>;
    openFilePicker: () => void;

    fileInputRef: RefObject<HTMLInputElement | null>;
};

const LabelContext = createContext<LabelContextType | null>(null);

export default LabelContext;
