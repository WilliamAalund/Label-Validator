import { useEffect, useState } from "react";

/** Object URLs must be created in an effect so Strict Mode does not reuse revoked URLs. */
const useObjectUrl = (file: File): string | null => {
    const [url, setUrl] = useState<string | null>(null);

    useEffect(() => {
        const objectUrl = URL.createObjectURL(file);
        // eslint-disable-next-line react-hooks/set-state-in-effect -- sync blob URL to state for display
        setUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [file]);

    return url;
}

type FileListItemProps = {
    file: File;
    onRemove: () => void;
};

const FileListItem = ({ file, onRemove }: FileListItemProps) => {
    const previewUrl = useObjectUrl(file);
    return (
        <li className="home-file-item">
            {previewUrl ? (
                <img src={previewUrl} alt={file.name} className="home-file-preview" />
            ) : (
                <div className="home-file-preview-placeholder" aria-hidden />
            )}
            <span className="home-file-name">{file.name}</span>
            <button type="button" onClick={onRemove}>
                Remove
            </button>
        </li>
    );
};

export default FileListItem;