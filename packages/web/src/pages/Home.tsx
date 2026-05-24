import { useContext, useState } from "react";
import FileListItem from "../components/FileListItem";
import LabelContext from "../context/LabelContext";

const Home = () => {
    const label = useContext(LabelContext);
    const [isDragOver, setIsDragOver] = useState(false);

    if (!label) {
        throw new Error("Home must be rendered within LabelProvider");
    }

    const {
        maxFiles,
        selectedFiles,
        atMaxFiles,
        canSubmit,
        addMorePrompt,
        addFilesFromInput,
        addFilesFromDataTransfer,
        removeFile,
        submitFiles,
        openFilePicker,
        fileInputRef,
    } = label;

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

        await addFilesFromDataTransfer(event.dataTransfer);
    };

    return (
        <div className="home">
            <p>Upload label images to get started. You can submit up to {maxFiles} files at once.</p>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={addFilesFromInput}
                disabled={atMaxFiles}
                hidden
            />

            {selectedFiles.length > 0 && (
                <ul className="home-file-list">
                    {selectedFiles.map((file, index) => (
                        <FileListItem
                            key={`${file.name}-${file.lastModified}-${index}`}
                            file={file}
                            onRemove={() => removeFile(index)}
                        />
                    ))}
                </ul>
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

            {addMorePrompt && <p>{addMorePrompt}</p>}

            {atMaxFiles && (
                <p>Maximum of {maxFiles} files reached. Remove a file to add a different one.</p>
            )}

            {selectedFiles.length === 0 ? (
                <button type="button" onClick={openFilePicker} disabled={atMaxFiles}>
                    Upload Image
                </button>
            ) : (
                !atMaxFiles && (
                    <button type="button" onClick={openFilePicker}>
                        Add more files
                    </button>
                )
            )}
            <button type="button" onClick={submitFiles} disabled={!canSubmit}>
                Upload {selectedFiles.length > 0 ? `${selectedFiles.length} ` : ""}
                {selectedFiles.length === 1 ? "File" : "Files"}
            </button>
        </div>
    );
};

export default Home;
