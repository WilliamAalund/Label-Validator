import type { SupportedMediaType } from "@label-validator/shared";

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
    return file.type === "image/png" ? "image/png" : "image/jpeg";
}
