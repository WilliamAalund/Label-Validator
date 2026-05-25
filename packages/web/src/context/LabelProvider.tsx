import {
    compareExpectedToExtracted,
    createEmptyExpectedLabel,
    LABEL_EXTRACTION_FIELD_DEFINITIONS,
    setExpectedValueAtPath,
    type ExpectedLabelValue,
} from "@label-validator/shared";
import {
    useCallback,
    useMemo,
    useRef,
    useState,
    type ChangeEvent,
    type ReactNode,
} from "react";
import LabelContext, {
    MAX_LABEL_FILES,
    type LabelContextType,
    type LabelValidationResult,
    type PendingLabelFile,
} from "./LabelContext";
import { batchItemErrorMessage, validateImageBatch } from "../routes/ValidateRoutes";
import { fileToBase64, toSupportedMediaType } from "../utils/FileUtils";

const isImageFile = (file: File) => file.type.startsWith("image/");

function createPendingFile(file: File): PendingLabelFile {
    return {
        id: crypto.randomUUID(),
        file,
        expected: createEmptyExpectedLabel(),
    };
}

async function extractDroppedImages(dataTransfer: DataTransfer): Promise<File[]> {
    const fromFiles = Array.from(dataTransfer.files).filter(isImageFile);
    if (fromFiles.length > 0) return fromFiles;

    const fromItems: File[] = [];
    for (const item of Array.from(dataTransfer.items)) {
        if (item.kind !== "file") continue;
        const file = item.getAsFile();
        if (file && isImageFile(file)) fromItems.push(file);
    }
    if (fromItems.length > 0) return fromItems;

    const url =
        dataTransfer.getData("text/uri-list").split("\n")[0]?.trim() ||
        dataTransfer.getData("text/plain").trim();
    if (!url || !/^https?:\/\//i.test(url)) return [];

    try {
        const response = await fetch(url);
        const blob = await response.blob();
        if (!blob.type.startsWith("image/")) return [];

        const name = url.split("/").pop()?.split("?")[0] || "dropped-image";
        return [new File([blob], name, { type: blob.type })];
    } catch {
        return [];
    }
}

type LabelProviderProps = {
    children: ReactNode;
};

const LabelProvider = ({ children }: LabelProviderProps) => {
    const [pendingFiles, setPendingFiles] = useState<PendingLabelFile[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [validationResults, setValidationResults] = useState<LabelValidationResult[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const skipClickAfterDropRef = useRef(false);

    const remainingSlots = MAX_LABEL_FILES - pendingFiles.length;
    const atMaxFiles = pendingFiles.length >= MAX_LABEL_FILES;
    const canSubmit = pendingFiles.length > 0 && !isSubmitting;

    const addFiles = useCallback((incoming: File[]) => {
        const images = incoming.filter(isImageFile);
        if (images.length === 0) return;

        setPendingFiles((prev) => {
            if (prev.length >= MAX_LABEL_FILES) return prev;
            const slotsLeft = MAX_LABEL_FILES - prev.length;
            const next = images.slice(0, slotsLeft).map(createPendingFile);
            return [...prev, ...next];
        });
    }, []);

    const updateExpectedValue = useCallback(
        (id: string, path: string, value: ExpectedLabelValue) => {
            setPendingFiles((prev) =>
                prev.map((entry) =>
                    entry.id === id
                        ? { ...entry, expected: setExpectedValueAtPath(entry.expected, path, value) }
                        : entry,
                ),
            );
        },
        [],
    );

    const removeFile = useCallback((id: string) => {
        setPendingFiles((prev) => prev.filter((entry) => entry.id !== id));
    }, []);

    const clearFiles = useCallback(() => {
        setPendingFiles([]);
    }, []);

    const addFilesFromInput = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => {
            addFiles(Array.from(event.target.files ?? []));
            event.target.value = "";
        },
        [addFiles],
    );

    const addFilesFromDataTransfer = useCallback(
        async (dataTransfer: DataTransfer) => {
            const images = await extractDroppedImages(dataTransfer);
            addFiles(images);
            if (images.length > 0) skipClickAfterDropRef.current = true;
        },
        [addFiles],
    );

    const submitFiles = useCallback(async () => {
        setError(null);
        setIsSubmitting(true);

        const filesToProcess = [...pendingFiles];

        try {
            const labels: { image: string; mediaType: ReturnType<typeof toSupportedMediaType> }[] =
                [];

            for (const entry of filesToProcess) {
                try {
                    labels.push({
                        image: await fileToBase64(entry.file),
                        mediaType: toSupportedMediaType(entry.file),
                    });
                } catch {
                    setError(`Could not read "${entry.file.name}".`);
                    return;
                }
            }

            const batchResult = await validateImageBatch({ labels });

            if (!batchResult.ok) {
                setError(batchResult.body.error);
                return;
            }

            const completed: LabelValidationResult[] = [];
            const completedIds = new Set<string>();
            const failedMessages: string[] = [];

            for (const item of batchResult.data.results) {
                const entry = filesToProcess[item.index];
                if (!entry) {
                    continue;
                }

                if (item.status === "success") {
                    completedIds.add(entry.id);
                    completed.push({
                        id: crypto.randomUUID(),
                        file: entry.file,
                        fileName: entry.file.name,
                        expected: entry.expected,
                        data: item.data,
                        complianceIssues: compareExpectedToExtracted(item.data, entry.expected),
                    });
                    continue;
                }

                failedMessages.push(`${entry.file.name}: ${batchItemErrorMessage(item)}`);
            }

            if (completed.length > 0) {
                setValidationResults((prev) => [...prev, ...completed]);
                setPendingFiles((prev) => prev.filter((e) => !completedIds.has(e.id)));
            }

            if (failedMessages.length > 0) {
                setError(failedMessages.join(" "));
            }
        } catch {
            setError("Unexpected error while validating labels.");
        } finally {
            setIsSubmitting(false);
        }
    }, [pendingFiles]);

    const openFilePicker = useCallback(() => {
        if (skipClickAfterDropRef.current) {
            skipClickAfterDropRef.current = false;
            return;
        }
        if (pendingFiles.length < MAX_LABEL_FILES) {
            fileInputRef.current?.click();
        }
    }, [pendingFiles.length]);

    const addMorePrompt = useMemo(() => {
        return `${pendingFiles.length} / ${MAX_LABEL_FILES} files uploaded`;
    }, [pendingFiles.length]);

    const value = useMemo<LabelContextType>(
        () => ({
            maxFiles: MAX_LABEL_FILES,
            labelFieldDefinitions: LABEL_EXTRACTION_FIELD_DEFINITIONS,
            pendingFiles,
            remainingSlots,
            atMaxFiles,
            canSubmit,
            addMorePrompt,
            error,
            setError,
            validationResults,
            isSubmitting,
            addFiles,
            updateExpectedValue,
            removeFile,
            clearFiles,
            addFilesFromInput,
            addFilesFromDataTransfer,
            submitFiles,
            openFilePicker,
            fileInputRef,
        }),
        [
            pendingFiles,
            remainingSlots,
            atMaxFiles,
            canSubmit,
            addMorePrompt,
            error,
            validationResults,
            isSubmitting,
            addFiles,
            updateExpectedValue,
            removeFile,
            clearFiles,
            addFilesFromInput,
            addFilesFromDataTransfer,
            submitFiles,
            openFilePicker,
        ],
    );

    return <LabelContext.Provider value={value}>{children}</LabelContext.Provider>;
};

export default LabelProvider;
