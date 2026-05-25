import { useObjectUrl } from "../hooks/useObjectUrl";

type FileListItemProps = {
    file: File;
    onRemove: () => void;
};

const FileListItem = ({ file, onRemove }: FileListItemProps) => {
    const previewUrl = useObjectUrl(file);

    return (
        <li className="home-upload-grid-cell home-file-item">
            {previewUrl ? (
                <img src={previewUrl} alt={file.name} className="home-file-preview" />
            ) : (
                <div className="home-file-preview-placeholder" aria-hidden />
            )}
            <span className="home-file-name">{file.name}</span>
            <button type="button" className="home-file-remove" onClick={onRemove}>
                Remove
            </button>
        </li>
    );
};

export default FileListItem;
