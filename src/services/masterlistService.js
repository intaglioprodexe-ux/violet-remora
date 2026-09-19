import { getJson } from "./apiClient.js";

const MASTERLIST_ENDPOINT = "/api/v1/masterlist/items";

export async function searchMasterlistItems(productCode = "") {
    const normalizedProductCode = String(productCode || "").trim();

    if (!normalizedProductCode) {
        throw new Error("Enter a product code before searching the masterlist.");
    }

    const query = `?product_code=${encodeURIComponent(normalizedProductCode)}`;
    const payload = await getJson(`${MASTERLIST_ENDPOINT}${query}`);

    if (!payload || !Array.isArray(payload.data)) {
        throw new Error(
            "The masterlist API response is not in the expected data-array format."
        );
    }

    return {
        items: payload.data,
        meta: payload.meta || {}
    };
}
