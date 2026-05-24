import type {
    LabelExtraction,
    VerifyLabelErrorResponse,
    VerifyLabelImageRequest,
    VerifyLabelSuccessResponse,
} from "@label-validator/shared";

export type ValidateImageResult =
    | { ok: true; data: LabelExtraction }
    | { ok: false; status: number; body: VerifyLabelErrorResponse };

function getApiBaseUrl(): string | undefined {
    const baseUrl = import.meta.env.VITE_API_URL;
    return typeof baseUrl === "string" && baseUrl.length > 0 ? baseUrl.replace(/\/$/, "") : undefined;
}

function isVerifyLabelSuccessResponse(body: unknown): body is VerifyLabelSuccessResponse {
    return (
        typeof body === "object" &&
        body !== null &&
        "data" in body &&
        typeof (body as VerifyLabelSuccessResponse).data === "object" &&
        (body as VerifyLabelSuccessResponse).data !== null
    );
}

function isVerifyLabelErrorResponse(body: unknown): body is VerifyLabelErrorResponse {
    return (
        typeof body === "object" &&
        body !== null &&
        "error" in body &&
        typeof (body as VerifyLabelErrorResponse).error === "string"
    );
}

export async function validateImage(payload: VerifyLabelImageRequest): Promise<ValidateImageResult> {
    const apiBaseUrl = getApiBaseUrl();
    if (!apiBaseUrl) {
        return {
            ok: false,
            status: 0,
            body: { error: "API URL is not configured (VITE_API_URL)." },
        };
    }

    let response: Response;
    try {
        response = await fetch(`${apiBaseUrl}/labels/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
    } catch {
        return {
            ok: false,
            status: 0,
            body: { error: "Could not reach the label verification API." },
        };
    }

    let body: unknown;
    try {
        body = await response.json();
    } catch {
        return {
            ok: false,
            status: response.status,
            body: { error: "Label verification API returned a non-JSON response." },
        };
    }

    if (response.ok && isVerifyLabelSuccessResponse(body)) {
        return { ok: true, data: body.data };
    }

    if (isVerifyLabelErrorResponse(body)) {
        return { ok: false, status: response.status, body };
    }

    return {
        ok: false,
        status: response.status,
        body: { error: "Unexpected response from label verification API." },
    };
}
