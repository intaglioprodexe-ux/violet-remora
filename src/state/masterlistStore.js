import { searchMasterlistItems } from "../services/masterlistService.js";

const { computed, ref } = window.Vue;

export function createMasterlistStore() {
    const items = ref([]);
    const searchTerm = ref("");
    const isLoading = ref(false);
    const error = ref("");
    const hasSearched = ref(false);
    const resultMeta = ref({});
    let requestSequence = 0;

    async function loadItems(nextSearchTerm = searchTerm.value) {
        const sequence = requestSequence + 1;
        requestSequence = sequence;
        searchTerm.value = String(nextSearchTerm || "").trim();
        error.value = "";
        hasSearched.value = true;

        if (!searchTerm.value) {
            items.value = [];
            resultMeta.value = {};
            error.value = "Enter a product code before searching the masterlist.";
            isLoading.value = false;
            return;
        }

        isLoading.value = true;

        try {
            const result = await searchMasterlistItems(searchTerm.value);

            if (sequence !== requestSequence) {
                return;
            }

            items.value = result.items;
            resultMeta.value = result.meta;
        } catch (requestError) {
            if (sequence !== requestSequence) {
                return;
            }

            items.value = [];
            resultMeta.value = {};
            error.value = requestError.message || "The masterlist could not be loaded.";
        } finally {
            if (sequence === requestSequence) {
                isLoading.value = false;
            }
        }
    }

    async function clearItems() {
        requestSequence += 1;
        items.value = [];
        searchTerm.value = "";
        error.value = "";
        hasSearched.value = false;
        resultMeta.value = {};
        isLoading.value = false;
    }

    return {
        items,
        searchTerm,
        isLoading,
        error,
        hasSearched,
        resultMeta,
        resultCount: computed(() => items.value.length),
        loadItems,
        clearItems
    };
}
