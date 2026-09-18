const EMPTY_VALUE = "—";

export const JOB_COLUMNS = Object.freeze([
    { key: "jobcard_raw", label: "Job card", emphasis: true },
    { key: "product_code", label: "Product code" },
    { key: "customer_name", label: "Customer" },
    { key: "product_name", label: "Product" },
    { key: "status", label: "Status" },
    { key: "printing_machine", label: "Machine" },
    { key: "printing_date", label: "Printing date" },
    { key: "order_qty", label: "Order quantity" }
]);

function firstPresentValue(job, keys) {
    for (const key of keys) {
        const value = job ? job[key] : null;

        if (value !== null && value !== undefined && String(value).trim() !== "") {
            return value;
        }
    }

    return null;
}

export function formatText(value) {
    if (value === null || value === undefined || String(value).trim() === "") {
        return EMPTY_VALUE;
    }

    return String(value);
}

export function formatJobCell(job, column) {
    if (column.key === "jobcard_raw") {
        return formatText(
            firstPresentValue(job, [
                "jobcard_raw",
                "jobcard_normalized",
                "jobcard_last4"
            ])
        );
    }

    return formatText(job ? job[column.key] : null);
}

export function getStatusClass(status) {
    const normalizedStatus = String(status || "").trim().toLowerCase();

    if (["complete", "completed", "delivered", "done"].includes(normalizedStatus)) {
        return "status-badge--complete";
    }

    if (["running", "in progress", "processing"].includes(normalizedStatus)) {
        return "status-badge--active";
    }

    if (["hold", "on hold", "stopped", "delayed", "overdue"].includes(normalizedStatus)) {
        return "status-badge--warning";
    }

    return "status-badge--neutral";
}
