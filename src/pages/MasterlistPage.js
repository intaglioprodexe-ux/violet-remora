import FeedbackPanel from "../components/common/FeedbackPanel.js";
import JobSearchBar from "../components/jobs/JobSearchBar.js";
import MasterlistTable from "../components/masterlist/MasterlistTable.js";
import { createMasterlistStore } from "../state/masterlistStore.js";

const { defineComponent } = window.Vue;

export default defineComponent({
    name: "MasterlistPage",
    components: {
        FeedbackPanel,
        JobSearchBar,
        MasterlistTable
    },
    setup() {
        const store = createMasterlistStore();

        function updateSearchTerm(value) {
            store.searchTerm.value = value;
        }

        async function handleSearch(value) {
            await store.loadItems(value);
        }

        async function handleClear() {
            await store.clearItems();
        }

        return {
            items: store.items,
            searchTerm: store.searchTerm,
            isLoading: store.isLoading,
            error: store.error,
            hasSearched: store.hasSearched,
            resultCount: store.resultCount,
            updateSearchTerm,
            handleSearch,
            handleClear
        };
    },
    template: `
        <main class="page-shell">
            <section class="page-heading">
                <div>
                    <p class="eyebrow">Product reference</p>
                    <h1>Masterlist</h1>
                    <p class="page-heading__description">
                        Search product specifications from the read-only masterlist database.
                    </p>
                </div>
            </section>

            <section class="panel">
                <JobSearchBar
                    :model-value="searchTerm"
                    :loading="isLoading"
                    label="Find a product"
                    placeholder="Product code"
                    hint="Enter a full or partial product code."
                    @update:model-value="updateSearchTerm"
                    @search="handleSearch"
                    @clear="handleClear"
                />

                <FeedbackPanel
                    v-if="error"
                    tone="error"
                    title="Could not load masterlist"
                    :message="error"
                />

                <div class="jobs-summary" aria-live="polite">
                    <span v-if="isLoading">Searching masterlist…</span>
                    <span v-else>{{ resultCount }} {{ resultCount === 1 ? "item" : "items" }} shown</span>
                    <span v-if="searchTerm" class="jobs-summary__filter">
                        Search: “{{ searchTerm }}”
                    </span>
                </div>

                <MasterlistTable
                    :items="items"
                    :loading="isLoading"
                    :has-searched="hasSearched"
                />
            </section>
        </main>
    `
});
