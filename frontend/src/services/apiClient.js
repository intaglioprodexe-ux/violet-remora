import { API_BASE_URL } from "../config.js";

export class ApiError extends Error {
    constructor(message, options = {}) {
        super(message);
        this.name = "ApiError";
        this.status = options.status || 0;
        this.code = options.code || "API_ERROR";
        this.requestId = options.requestId || "";
        this.cause = options.cause;
    }
}

function createRequestId() {
    if (
        globalThis.crypto &&
        typeof globalThis.crypto.randomUUID === "function"
    ) {
        return globalThis.crypto.randomUUID();
    }

    return `web-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function buildUrl(path) {
    if (/^https?:\/\//i.test(path)) {
        return path;
    }

    const normalizedPath = String(path).startsWith("/") ? path : `/${path}`;
    return `${API_BASE_URL}${normalizedPath}`;
}

async function parseJsonResponse(response) {
    const responseText = await response.text();

    if (!responseText) {
        return null;
    }

    try {
        return JSON.parse(responseText);
    } catch (error) {
        throw new ApiError("The API returned invalid JSON.", {
            status: response.status,
            code: "INVALID_API_JSON",
            requestId: response.headers.get("x-request-id") || "",
            cause: error
        });
    }
}

export async function getJson(path) {
    let response;

    try {
        response = await fetch(buildUrl(path), {
            method: "GET",
            headers: {
                Accept: "application/json",
                "X-Request-Id": createRequestId()
            }
        });
    } catch (error) {
        throw new ApiError(
            "The API could not be reached. Check that the backend is running.",
            {
                code: "NETWORK_ERROR",
                cause: error
            }
        );
    }

    const payload = await parseJsonResponse(response);

    if (!response.ok) {
        const apiError = payload && payload.error ? payload.error : {};

        throw new ApiError(
            apiError.message || `The API request failed with status ${response.status}.`,
            {
                status: response.status,
                code: apiError.code || "API_REQUEST_FAILED",
                requestId:
                    apiError.request_id ||
                    response.headers.get("x-request-id") ||
                    ""
            }
        );
    }

    return payload;
}
