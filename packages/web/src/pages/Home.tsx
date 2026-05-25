import { useContext, useState } from "react";
import FileListItem from "../components/FileListItem";
import ValidatedLabelCard from "../components/ValidatedLabelCard";
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
        error,
        validationResults,
        isSubmitting,
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
            <div className="home-content">
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

                <ul className="home-upload-grid" aria-label="Label images to validate">
                    {selectedFiles.map((file, index) => (
                        <FileListItem
                            key={`${file.name}-${file.lastModified}-${index}`}
                            file={file}
                            onRemove={() => removeFile(index)}
                        />
                    ))}
                    <li className="home-upload-grid-cell home-upload-grid-cell--drop">
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
                            <img src="/camera.webp" alt="" />
                            <p>
                                {atMaxFiles
                                    ? "Maximum files reached"
                                    : "Drag and drop label images here, or click to browse"}
                            </p>
                        </button>
                    </li>
                </ul>

                {addMorePrompt && <p>{addMorePrompt}</p>}


                <button type="button" onClick={submitFiles} disabled={!canSubmit}>
                    {isSubmitting
                        ? "Validating…"
                        : `Validate ${selectedFiles.length > 0 ? `${selectedFiles.length} ` : ""}${
                            selectedFiles.length === 1 ? "File" : "Files"
                        }`}
                </button>

                {isSubmitting && <p className="home-status">Analyzing label…</p>}

                {validationResults.length > 0 && (
                    <section className="home-validated" aria-live="polite">
                        <h2>Validated labels</h2>
                        <ul className="home-validated-list">
                            {validationResults.map((result) => (
                                <ValidatedLabelCard key={result.id} result={result} />
                            ))}
                        </ul>
                    </section>
                )}

                {error && (
                    <p className="home-error" role="alert">
                        {error}
                    </p>
                )}
            </div>
        </div>
    );
};

export default Home;
