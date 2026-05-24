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
} from "./LabelContext";
import { validateImage } from "../routes/ValidateRoutes";
import { fileToBase64, toSupportedMediaType } from "../utils/FileUtils";
const isImageFile = (file: File) => file.type.startsWith("image/");

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
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [validationResults, setValidationResults] = useState<LabelValidationResult[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const skipClickAfterDropRef = useRef(false);

    const remainingSlots = MAX_LABEL_FILES - selectedFiles.length;
    const atMaxFiles = selectedFiles.length >= MAX_LABEL_FILES;
    const canSubmit = selectedFiles.length > 0 && !isSubmitting;

    const addFiles = useCallback((incoming: File[]) => {
        const images = incoming.filter(isImageFile);
        if (images.length === 0) return;

        setSelectedFiles((prev) => {
            if (prev.length >= MAX_LABEL_FILES) return prev;
            return [...prev, ...images].slice(0, MAX_LABEL_FILES);
        });
    }, []);

    const removeFile = useCallback((index: number) => {
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    }, []);

    const clearFiles = useCallback(() => {
        setSelectedFiles([]);
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

        const filesToProcess = [...selectedFiles];

        try {
            for (const file of filesToProcess) {
                let base64: string;
                try {
                    base64 = await fileToBase64(file);
                } catch {
                    setError(`Could not read "${file.name}".`);
                    return;
                }

                const result = await validateImage({
                    image: base64,
                    mediaType: toSupportedMediaType(file),
                });

                if (!result.ok) {
                    setError(`${file.name}: ${result.body.error}`);
                    return;
                }

                const completed: LabelValidationResult = {
                    id: crypto.randomUUID(),
                    file,
                    fileName: file.name,
                    data: result.data,
                };

                setValidationResults((prev) => [...prev, completed]);
                setSelectedFiles((prev) => prev.filter((f) => f !== file));
            }
        } catch {
            setError("Unexpected error while validating labels.");
        } finally {
            setIsSubmitting(false);
        }
    }, [selectedFiles]);

    const openFilePicker = useCallback(() => {
        if (skipClickAfterDropRef.current) {
            skipClickAfterDropRef.current = false;
            return;
        }
        if (selectedFiles.length < MAX_LABEL_FILES) {
            fileInputRef.current?.click();
        }
    }, [selectedFiles.length]);

    const addMorePrompt = useMemo(() => {
        if (selectedFiles.length === 1) {
            return `You've added 1 label image. Add up to ${MAX_LABEL_FILES - 1} more to validate a batch (maximum ${MAX_LABEL_FILES} files).`;
        }
        if (selectedFiles.length > 1 && !atMaxFiles) {
            return `You've added ${selectedFiles.length} label images. You can add ${remainingSlots} more (maximum ${MAX_LABEL_FILES} files).`;
        }
        return null;
    }, [selectedFiles.length, atMaxFiles, remainingSlots]);

    const value = useMemo<LabelContextType>(
        () => ({
            maxFiles: MAX_LABEL_FILES,
            selectedFiles,
            remainingSlots,
            atMaxFiles,
            canSubmit,
            addMorePrompt,
            error,
            setError,
            validationResults,
            isSubmitting,
            addFiles,
            removeFile,
            clearFiles,
            addFilesFromInput,
            addFilesFromDataTransfer,
            submitFiles,
            openFilePicker,
            fileInputRef,
        }),
        [
            selectedFiles,
            remainingSlots,
            atMaxFiles,
            canSubmit,
            addMorePrompt,
            error,
            validationResults,
            isSubmitting,
            addFiles,
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
