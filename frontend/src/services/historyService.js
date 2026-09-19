import { getJson } from "./apiClient.js";

const JOBS_ENDPOINT = "/api/v1/history/jobs";

export async function searchHistoryJobs(searchTerm = "") {
    const normalizedSearch = String(searchTerm || "").trim();
    const query = normalizedSearch
        ? `?search=${encodeURIComponent(normalizedSearch)}`
        : "";

    const payload = await getJson(`${JOBS_ENDPOINT}${query}`);

    if (!payload || !Array.isArray(payload.data)) {
        throw new Error(
            "The jobs API response is not in the expected data-array format."
        );
    }

    return {
        jobs: payload.data,
        meta: payload.meta || {}
    };
}
