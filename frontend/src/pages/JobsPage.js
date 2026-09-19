import FeedbackPanel from "../components/common/FeedbackPanel.js";
import JobSearchBar from "../components/jobs/JobSearchBar.js";
import JobsSummary from "../components/jobs/JobsSummary.js";
import JobsTable from "../components/jobs/JobsTable.js";
import { createJobsStore } from "../state/jobsStore.js";

const { defineComponent, onMounted } = window.Vue;

export default defineComponent({
    name: "JobsPage",
    components: {
        FeedbackPanel,
        JobSearchBar,
        JobsSummary,
        JobsTable
    },
    setup() {
        const store = createJobsStore();

        function updateSearchTerm(value) {
            store.searchTerm.value = value;
        }

        async function handleSearch(value) {
            await store.loadJobs(value);
        }

        async function handleClear() {
            await store.loadJobs("");
        }

        async function refreshJobs() {
            await store.loadJobs(store.searchTerm.value);
        }

        onMounted(() => {
            store.loadJobs("");
        });

        return {
            jobs: store.jobs,
            searchTerm: store.searchTerm,
            isLoading: store.isLoading,
            error: store.error,
            resultCount: store.resultCount,
            updateSearchTerm,
            handleSearch,
            handleClear,
            refreshJobs
        };
    },
    template: `
        <main class="page-shell">
            <section class="page-heading">
                <div>
                    <p class="eyebrow">Production history</p>
                    <h1>Jobs</h1>
                    <p class="page-heading__description">
                        View and search the available job history from the ERP API.
                    </p>
                </div>
                <button
                    class="button button--secondary"
                    type="button"
                    :disabled="isLoading"
                    @click="refreshJobs"
                >
                    Refresh
                </button>
            </section>

            <section class="panel">
                <JobSearchBar
                    :model-value="searchTerm"
                    :loading="isLoading"
                    @update:model-value="updateSearchTerm"
                    @search="handleSearch"
                    @clear="handleClear"
                />

                <FeedbackPanel
                    v-if="error"
                    tone="error"
                    title="Could not load jobs"
                    :message="error"
                />

                <JobsSummary
                    :count="resultCount"
                    :search-term="searchTerm"
                    :loading="isLoading"
                />

                <JobsTable :jobs="jobs" :loading="isLoading" />
            </section>
        </main>
    `
});
