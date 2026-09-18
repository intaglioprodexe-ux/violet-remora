import {
    JOB_COLUMNS,
    formatJobCell,
    getStatusClass
} from "../../utils/jobFormatters.js";

const { defineComponent } = window.Vue;

export default defineComponent({
    name: "JobsTable",
    props: {
        jobs: {
            type: Array,
            default: () => []
        },
        loading: {
            type: Boolean,
            default: false
        }
    },
    setup() {
        return {
            columns: JOB_COLUMNS,
            formatJobCell,
            getStatusClass
        };
    },
    template: `
        <div class="table-scroll">
            <table class="jobs-table">
                <caption class="sr-only">Production job history</caption>
                <thead>
                    <tr>
                        <th v-for="column in columns" :key="column.key" scope="col">
                            {{ column.label }}
                        </th>
                    </tr>
                </thead>
                <tbody v-if="loading">
                    <tr>
                        <td class="table-state" :colspan="columns.length">Loading jobs…</td>
                    </tr>
                </tbody>
                <tbody v-else-if="jobs.length === 0">
                    <tr>
                        <td class="table-state" :colspan="columns.length">No jobs found.</td>
                    </tr>
                </tbody>
                <tbody v-else>
                    <tr v-for="(job, index) in jobs" :key="job.id || job.jobcard_raw || index">
                        <td v-for="column in columns" :key="column.key">
                            <span
                                v-if="column.key === 'status'"
                                class="status-badge"
                                :class="getStatusClass(job.status)"
                            >
                                {{ formatJobCell(job, column) }}
                            </span>
                            <span
                                v-else
                                :class="{ 'cell--emphasis': column.emphasis }"
                            >
                                {{ formatJobCell(job, column) }}
                            </span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    `
});
