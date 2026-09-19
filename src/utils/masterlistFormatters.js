const EMPTY_VALUE = "—";

export const MASTERLIST_COLUMNS = Object.freeze([
    { key: "product_code", label: "Product code", emphasis: true },
    { key: "product_status", label: "Status" },
    { key: "customer_name", label: "Customer" },
    { key: "product_name", label: "Product" },
    { key: "print_material", label: "Print material" },
    { key: "print_film_width", label: "Film width" },
    { key: "print_film_thickness_um", label: "Film thickness" },
    { key: "label_width_mm", label: "Label width" },
    { key: "label_height_mm", label: "Label height" },
    { key: "ups", label: "UPS" }
]);

export function formatMasterlistText(value) {
    if (value === null || value === undefined || String(value).trim() === "") {
        return EMPTY_VALUE;
    }

    return String(value);
}

export function formatMasterlistCell(item, column) {
    if (!item) {
        return EMPTY_VALUE;
    }

    if (column.key === "product_code") {
        return formatMasterlistText(
            item.product_code || item.product_code_normalized || item.product_code_raw
        );
    }

    return formatMasterlistText(item[column.key]);
}
