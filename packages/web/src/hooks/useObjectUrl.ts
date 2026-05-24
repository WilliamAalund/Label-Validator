import { useEffect, useState } from "react";

/** Object URLs must be created in an effect so Strict Mode does not reuse revoked URLs. */
export function useObjectUrl(file: File): string | null {
    const [url, setUrl] = useState<string | null>(null);

    useEffect(() => {
        const objectUrl = URL.createObjectURL(file);
        // eslint-disable-next-line react-hooks/set-state-in-effect -- sync blob URL to state for display
        setUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [file]);

    return url;
}
