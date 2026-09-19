import {
    formatMasterlistCell,
    MASTERLIST_COLUMNS
} from "../../utils/masterlistFormatters.js";

const { defineComponent } = window.Vue;

export default defineComponent({
    name: "MasterlistTable",
    props: {
        items: {
            type: Array,
            default: () => []
        },
        loading: {
            type: Boolean,
            default: false
        },
        hasSearched: {
            type: Boolean,
            default: false
        }
    },
    setup() {
        return {
            columns: MASTERLIST_COLUMNS,
            formatMasterlistCell
        };
    },
    template: `
        <div class="table-scroll">
            <table class="masterlist-table">
                <caption class="sr-only">Masterlist product specifications</caption>
                <thead>
                    <tr>
                        <th v-for="column in columns" :key="column.key" scope="col">
                            {{ column.label }}
                        </th>
                    </tr>
                </thead>
                <tbody v-if="loading">
                    <tr>
                        <td class="table-state" :colspan="columns.length">Searching masterlist…</td>
                    </tr>
                </tbody>
                <tbody v-else-if="!hasSearched">
                    <tr>
                        <td class="table-state" :colspan="columns.length">
                            Enter a product code above to search the masterlist.
                        </td>
                    </tr>
                </tbody>
                <tbody v-else-if="items.length === 0">
                    <tr>
                        <td class="table-state" :colspan="columns.length">
                            No matching masterlist items found.
                        </td>
                    </tr>
                </tbody>
                <tbody v-else>
                    <tr v-for="(item, index) in items" :key="item.id || item.product_code || index">
                        <td v-for="column in columns" :key="column.key">
                            <span
                                v-if="column.key === 'product_status'"
                                class="status-badge status-badge--neutral"
                            >
                                {{ formatMasterlistCell(item, column) }}
                            </span>
                            <span
                                v-else
                                :class="{ 'cell--emphasis': column.emphasis }"
                            >
                                {{ formatMasterlistCell(item, column) }}
                            </span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    `
});
