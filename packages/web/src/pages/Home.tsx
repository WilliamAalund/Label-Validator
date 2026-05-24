import { useRef, useState } from "react";
import FileListItem from "../components/FileListItem";

const MAX_FILES = 5;

const isImageFile = (file: File) => file.type.startsWith("image/");

const Home = () => {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const skipClickAfterDropRef = useRef(false);

    const remainingSlots = MAX_FILES - selectedFiles.length;
    const atMaxFiles = selectedFiles.length >= MAX_FILES;

    const addFiles = (incoming: File[]) => {
        const images = incoming.filter(isImageFile);
        if (images.length === 0) return;

        setSelectedFiles((prev) => {
            if (prev.length >= MAX_FILES) return prev;
            return [...prev, ...images].slice(0, MAX_FILES);
        });
    };

    const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        addFiles(Array.from(event.target.files ?? []));
        event.target.value = "";
    };

    const removeFile = (index: number) => {
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const onFileUpload = () => {
        console.log(selectedFiles);
    };

    const extractDroppedImages = async (dataTransfer: DataTransfer): Promise<File[]> => {
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
    };

    const onDragEnter = (event: React.DragEvent) => {
        event.preventDefault();
        if (!atMaxFiles) setIsDragOver(true);
    };

    const onDragOver = (event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = atMaxFiles ? "none" : "copy";
    };

    const onDragLeave = (event: React.DragEvent) => {
        event.preventDefault();
        if (event.currentTarget.contains(event.relatedTarget as Node)) return;
        setIsDragOver(false);
    };

    const onDrop = async (event: React.DragEvent) => {
        event.preventDefault();
        setIsDragOver(false);
        if (atMaxFiles) return;

        const images = await extractDroppedImages(event.dataTransfer);
        addFiles(images);
        skipClickAfterDropRef.current = true;
    };

    const openFilePicker = () => {
        if (skipClickAfterDropRef.current) {
            skipClickAfterDropRef.current = false;
            return;
        }
        if (!atMaxFiles) fileInputRef.current?.click();
    };

    const addMorePrompt =
        selectedFiles.length === 1
            ? "You've added 1 label image. Add up to 4 more to validate a batch (maximum 5 files)."
            : selectedFiles.length > 1 && !atMaxFiles
              ? `You've added ${selectedFiles.length} label images. You can add ${remainingSlots} more (maximum 5 files).`
              : null;

    return (
        <div className="home">
            <h1>Welcome to the TTB Label Validator</h1>
            <p>Upload label images to get started. You can submit up to {MAX_FILES} files at once.</p>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={onFileChange}
                disabled={atMaxFiles}
                hidden
            />

            {selectedFiles.length > 0 && (
                <>
                    <ul className="home-file-list">
                        {selectedFiles.map((file, index) => (
                            <FileListItem
                                key={`${file.name}-${file.lastModified}-${index}`}
                                file={file}
                                onRemove={() => removeFile(index)}
                            />
                        ))}
                    </ul>

                    {addMorePrompt && <p>{addMorePrompt}</p>}

                    {atMaxFiles && (
                        <p>Maximum of {MAX_FILES} files reached. Remove a file to add a different one.</p>
                    )}
                </>
            )}

            <button
                type="button"
                className="home-drop-zone"
                aria-label="Drag and drop label images here, or click to browse"
                disabled={atMaxFiles}
                data-drag-over={isDragOver || undefined}
                onClick={openFilePicker}
                onDragEnter={onDragEnter}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
            >
                {atMaxFiles
                    ? "Maximum files reached"
                    : "Drag and drop label images here, or click to browse"}
            </button>

            {selectedFiles.length === 0 ? (
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={atMaxFiles}>
                    Upload Image
                </button>
            ) : (
                !atMaxFiles && (
                    <button type="button" onClick={() => fileInputRef.current?.click()}>
                        Add more files
                    </button>
                )
            )}
            <button type="button" onClick={onFileUpload} disabled={selectedFiles.length === 0}>
                Upload {selectedFiles.length > 0 ? `${selectedFiles.length} ` : ""}
                {selectedFiles.length === 1 ? "File" : "Files"}
            </button>
        </div>
    );
};

export default Home;
