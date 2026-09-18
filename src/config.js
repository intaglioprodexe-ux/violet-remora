const DEFAULT_API_BASE_URL = "http://127.0.0.1:3000";

function trimTrailingSlash(value) {
    return String(value || "").replace(/\/+$/, "");
}

const configuredApiUrl =
    typeof window !== "undefined" ? window.VIOLET_REMORA_API_URL : "";

export const API_BASE_URL = trimTrailingSlash(
    configuredApiUrl || DEFAULT_API_BASE_URL
);
