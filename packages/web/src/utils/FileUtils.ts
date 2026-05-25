import { SUPPORTED_MEDIA_TYPES, type SupportedMediaType } from "@label-validator/shared";

const SUPPORTED_MEDIA_TYPE_SET = new Set<string>(SUPPORTED_MEDIA_TYPES);

/** Reads a file as raw base64 (no `data:image/...;base64,` prefix). */
export function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result;
            if (typeof result !== "string") {
                reject(new Error("Failed to read file as base64."));
                return;
            }
            const match = /^data:[^;]+;base64,(.+)$/i.exec(result);
            resolve(match?.[1] ?? result);
        };
        reader.onerror = () => reject(reader.error ?? new Error("Failed to read file."));
        reader.readAsDataURL(file);
    });
}

export function toSupportedMediaType(file: File): SupportedMediaType {
    if (SUPPORTED_MEDIA_TYPE_SET.has(file.type)) {
        return file.type as SupportedMediaType;
    }

    const name = file.name.toLowerCase();
    if (name.endsWith(".webp")) {
        return "image/webp";
    }
    if (name.endsWith(".png")) {
        return "image/png";
    }

    return "image/jpeg";
}
