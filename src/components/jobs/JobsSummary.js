const { defineComponent } = window.Vue;

export default defineComponent({
    name: "JobsSummary",
    props: {
        count: {
            type: Number,
            default: 0
        },
        searchTerm: {
            type: String,
            default: ""
        },
        loading: {
            type: Boolean,
            default: false
        }
    },
    template: `
        <div class="jobs-summary" aria-live="polite">
            <span v-if="loading">Loading jobs…</span>
            <span v-else>{{ count }} {{ count === 1 ? "job" : "jobs" }} shown</span>
            <span v-if="searchTerm" class="jobs-summary__filter">
                Search: “{{ searchTerm }}”
            </span>
        </div>
    `
});
