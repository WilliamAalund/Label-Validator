import type { LabelValidationResult } from "../context/LabelContext";
import { useObjectUrl } from "../hooks/useObjectUrl";

type ValidatedLabelCardProps = {
    result: LabelValidationResult;
};

const ValidatedLabelCard = ({ result }: ValidatedLabelCardProps) => {
    const previewUrl = useObjectUrl(result.file);

    return (
        <li className="home-validated-item">
            {previewUrl ? (
                <img src={previewUrl} alt={result.fileName} className="home-validated-preview" />
            ) : (
                <div className="home-validated-preview-placeholder" aria-hidden />
            )}
            <details className="home-validated-details">
                <summary>Validation results — {result.fileName}</summary>
                <dl className="home-result-fields home-validated-fields">
                    <div>
                        <dt>Brand</dt>
                        <dd>{result.data.brand_name}</dd>
                    </div>
                    <div>
                        <dt>Class / type</dt>
                        <dd>{result.data.class_type}</dd>
                    </div>
                    <div>
                        <dt>ABV</dt>
                        <dd>{result.data.abv}</dd>
                    </div>
                    <div>
                        <dt>Net contents</dt>
                        <dd>{result.data.net_contents}</dd>
                    </div>
                    <div>
                        <dt>Bottler address</dt>
                        <dd>{result.data.bottler_address}</dd>
                    </div>
                    <div>
                        <dt>Government warning</dt>
                        <dd>{result.data.government_warning.text}</dd>
                    </div>
                </dl>
            </details>
        </li>
    );
};

export default ValidatedLabelCard;
