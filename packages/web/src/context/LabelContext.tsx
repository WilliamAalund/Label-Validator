import { createContext, type ChangeEvent, type RefObject } from "react";

export const MAX_LABEL_FILES = 5 as const;

export type LabelContextType = {
    maxFiles: typeof MAX_LABEL_FILES;
    selectedFiles: File[];
    remainingSlots: number;
    atMaxFiles: boolean;
    canSubmit: boolean;
    addMorePrompt: string | null;

    addFiles: (files: File[]) => void;
    removeFile: (index: number) => void;
    clearFiles: () => void;
    addFilesFromInput: (event: ChangeEvent<HTMLInputElement>) => void;
    addFilesFromDataTransfer: (dataTransfer: DataTransfer) => Promise<void>;
    submitFiles: () => void;
    openFilePicker: () => void;

    fileInputRef: RefObject<HTMLInputElement | null>;
};

const LabelContext = createContext<LabelContextType | null>(null);

export default LabelContext;
