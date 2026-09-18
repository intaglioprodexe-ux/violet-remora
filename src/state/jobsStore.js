import { searchHistoryJobs } from "../services/historyService.js";

const { computed, ref } = window.Vue;

export function createJobsStore() {
    const jobs = ref([]);
    const searchTerm = ref("");
    const isLoading = ref(false);
    const error = ref("");
    const resultMeta = ref({});
    let requestSequence = 0;

    function getErrorMessage(requestError) {
        if (requestError && typeof requestError.message === "string") {
            return requestError.message;
        }

        return "The jobs could not be loaded.";
    }

    async function loadJobs(nextSearchTerm = searchTerm.value) {
        const sequence = requestSequence + 1;
        requestSequence = sequence;
        searchTerm.value = String(nextSearchTerm || "").trim();
        isLoading.value = true;
        error.value = "";

        try {
            const result = await searchHistoryJobs(searchTerm.value);

            if (sequence !== requestSequence) {
                return;
            }

            jobs.value = result.jobs;
            resultMeta.value = result.meta;
        } catch (requestError) {
            if (sequence !== requestSequence) {
                return;
            }

            jobs.value = [];
            resultMeta.value = {};
            error.value = getErrorMessage(requestError);
        } finally {
            if (sequence === requestSequence) {
                isLoading.value = false;
            }
        }
    }

    return {
        jobs,
        searchTerm,
        isLoading,
        error,
        resultMeta,
        resultCount: computed(() => jobs.value.length),
        loadJobs
    };
}
