import type {
    LabelExtraction,
    VerifyLabelBatchItemResult,
    VerifyLabelBatchRequest,
    VerifyLabelBatchResponse,
    VerifyLabelErrorResponse,
    VerifyLabelImageRequest,
    VerifyLabelSuccessResponse,
} from "@label-validator/shared";

export type ValidateImageResult =
    | { ok: true; data: LabelExtraction }
    | { ok: false; status: number; body: VerifyLabelErrorResponse };

export type ValidateBatchResult =
    | { ok: true; data: VerifyLabelBatchResponse }
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

function isVerifyLabelBatchResponse(body: unknown): body is VerifyLabelBatchResponse {
    return (
        typeof body === "object" &&
        body !== null &&
        "results" in body &&
        Array.isArray((body as VerifyLabelBatchResponse).results)
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

async function postJson(url: string, payload: unknown): Promise<{
    response: Response;
    body: unknown;
}> {
    let response: Response;
    try {
        response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
    } catch {
        throw new Error("FETCH_FAILED");
    }

    let body: unknown;
    try {
        body = await response.json();
    } catch {
        return {
            response,
            body: { error: "Label verification API returned a non-JSON response." },
        };
    }

    return { response, body };
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

    try {
        const { response, body } = await postJson(`${apiBaseUrl}/labels/verify`, payload);

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
    } catch (error) {
        if (error instanceof Error && error.message === "FETCH_FAILED") {
            return {
                ok: false,
                status: 0,
                body: { error: "Could not reach the label verification API." },
            };
        }
        throw error;
    }
}

export async function validateImageBatch(
    payload: VerifyLabelBatchRequest,
): Promise<ValidateBatchResult> {
    const apiBaseUrl = getApiBaseUrl();
    if (!apiBaseUrl) {
        return {
            ok: false,
            status: 0,
            body: { error: "API URL is not configured (VITE_API_URL)." },
        };
    }

    try {
        const { response, body } = await postJson(`${apiBaseUrl}/labels/verify-batch`, payload);

        if (response.ok && isVerifyLabelBatchResponse(body)) {
            return { ok: true, data: body };
        }

        if (isVerifyLabelErrorResponse(body)) {
            return { ok: false, status: response.status, body };
        }

        return {
            ok: false,
            status: response.status,
            body: { error: "Unexpected response from label verification API." },
        };
    } catch (error) {
        if (error instanceof Error && error.message === "FETCH_FAILED") {
            return {
                ok: false,
                status: 0,
                body: { error: "Could not reach the label verification API." },
            };
        }
        throw error;
    }
}

export function batchItemErrorMessage(item: VerifyLabelBatchItemResult): string {
    if (item.status === "success") {
        return "";
    }
    return item.error;
}
