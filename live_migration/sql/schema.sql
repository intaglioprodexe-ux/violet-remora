PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS live_import_batches (
    id INTEGER PRIMARY KEY,
    batch_key TEXT NOT NULL UNIQUE,
    source_file TEXT NOT NULL,
    source_file_sha256 TEXT NOT NULL,
    source_sheet TEXT NOT NULL,
    source_file_size_bytes INTEGER NOT NULL,
    started_at_utc TEXT NOT NULL,
    completed_at_utc TEXT,
    status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
    rows_seen INTEGER NOT NULL DEFAULT 0,
    rows_loaded INTEGER NOT NULL DEFAULT 0,
    rows_rejected INTEGER NOT NULL DEFAULT 0,
    rows_ignored_blank INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS live_source_rows (
    id INTEGER PRIMARY KEY,
    import_batch_id INTEGER NOT NULL REFERENCES live_import_batches(id),
    source_file TEXT NOT NULL,
    source_file_sha256 TEXT NOT NULL,
    source_sheet TEXT NOT NULL,
    source_row INTEGER NOT NULL,
    source_row_sha256 TEXT NOT NULL,
    raw_payload_json TEXT NOT NULL,
    UNIQUE (source_file, source_sheet, source_row)
);

CREATE TABLE IF NOT EXISTS live_jobs (
    id INTEGER PRIMARY KEY,
    source_row_id INTEGER NOT NULL UNIQUE REFERENCES live_source_rows(id) ON DELETE CASCADE,
    jobcard_raw TEXT NOT NULL,
    jobcard_normalized TEXT,
    jobcard_last4 TEXT,
    no_value TEXT,
    incoming_date TEXT,
    delivery_date_requested TEXT,
    itg_etd TEXT,
    overdue_days TEXT,
    po_number TEXT,
    product_code TEXT,
    customer_name TEXT,
    order_remark TEXT,
    product_name TEXT,
    order_qty TEXT,
    print_material TEXT,
    print_film_width TEXT,
    print_film_thickness_um TEXT,
    slitting_size TEXT,
    printing_rubber_roller_size_1 TEXT,
    printing_rubber_roller_size_2 TEXT,
    printing_rubber_roller_size_3 TEXT,
    printing_rubber_roller_size_4 TEXT,
    colour_quantity TEXT,
    label_width_mm TEXT,
    label_height_mm TEXT,
    ups TEXT,
    print_film_density TEXT,
    final_delivery_form TEXT,
    roll_length_m TEXT,
    meter_run TEXT,
    status TEXT,
    printing_machine TEXT,
    printing_date TEXT,
    film_status TEXT,
    cylinder_status TEXT,
    cylinder_supplier TEXT,
    check_cylinder_date TEXT,
    remarks TEXT,
    laminated_pass_1 TEXT,
    laminated_pass_2 TEXT,
    laminated_pass_3 TEXT,
    slitting_scheduled TEXT,
    slitting_actual TEXT,
    seaming_scheduled TEXT,
    seaming_actual TEXT,
    inspection_scheduled TEXT,
    inspection_actual TEXT,
    cutting_scheduled TEXT,
    cutting_actual TEXT,
    packing_scheduled TEXT,
    packing_actual TEXT,
    delivery_date_actual TEXT,
    delivered_qty TEXT,
    do_number TEXT,
    stock_balance TEXT,
    extra_column_1 TEXT,
    extra_column_2 TEXT,
    kg_per_meter TEXT
);

CREATE TABLE IF NOT EXISTS live_import_rejections (
    id INTEGER PRIMARY KEY,
    source_row_id INTEGER NOT NULL UNIQUE REFERENCES live_source_rows(id) ON DELETE CASCADE,
    rule_code TEXT NOT NULL,
    reason TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_live_jobs_jobcard_normalized ON live_jobs(jobcard_normalized);
CREATE INDEX IF NOT EXISTS idx_live_jobs_jobcard_last4 ON live_jobs(jobcard_last4);
CREATE INDEX IF NOT EXISTS idx_live_jobs_product_code ON live_jobs(product_code);
CREATE INDEX IF NOT EXISTS idx_live_jobs_customer_name ON live_jobs(customer_name);
CREATE INDEX IF NOT EXISTS idx_live_jobs_status ON live_jobs(status);

CREATE VIEW IF NOT EXISTS live_job_lookup AS
SELECT
    j.id,
    j.jobcard_raw,
    j.jobcard_normalized,
    j.jobcard_last4,
    j.product_code,
    j.customer_name,
    j.product_name,
    j.order_qty,
    j.meter_run,
    j.status,
    j.printing_machine,
    j.printing_date,
    s.source_file,
    s.source_sheet,
    s.source_row,
    b.completed_at_utc AS imported_at_utc
FROM live_jobs AS j
JOIN live_source_rows AS s ON s.id = j.source_row_id
JOIN live_import_batches AS b ON b.id = s.import_batch_id;

