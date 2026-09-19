const { defineComponent } = window.Vue;

export default defineComponent({
    name: "JobSearchBar",
    props: {
        label: {
            type: String,
            default: "Find a job"
        },
        modelValue: {
            type: String,
            default: ""
        },
        placeholder: {
            type: String,
            default: "Job card or final 4 digits"
        },
        hint: {
            type: String,
            default: "Search by full job card or final four digits."
        },
        loading: {
            type: Boolean,
            default: false
        }
    },
    emits: ["update:modelValue", "search", "clear"],
    setup(props, { emit }) {
        function updateValue(event) {
            emit("update:modelValue", event.target.value);
        }

        function submitSearch() {
            emit("search", props.modelValue.trim());
        }

        function clearSearch() {
            emit("clear");
        }

        return {
            updateValue,
            submitSearch,
            clearSearch
        };
    },
    template: `
        <form class="search-bar" @submit.prevent="submitSearch">
            <label class="search-bar__label" for="job-search">{{ label }}</label>
            <div class="search-bar__controls">
                <input
                    id="job-search"
                    class="search-bar__input"
                    type="search"
                    :value="modelValue"
                    :placeholder="placeholder"
                    autocomplete="off"
                    inputmode="search"
                    @input="updateValue"
                >
                <button class="button button--primary" type="submit" :disabled="loading">
                    {{ loading ? "Searching…" : "Search" }}
                </button>
                <button
                    v-if="modelValue"
                    class="button button--quiet"
                    type="button"
                    :disabled="loading"
                    @click="clearSearch"
                >
                    Clear
                </button>
            </div>
            <p class="search-bar__hint">{{ hint }}</p>
        </form>
    `
});
