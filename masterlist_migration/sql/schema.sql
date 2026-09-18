PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schema_metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

INSERT OR REPLACE INTO schema_metadata (key, value)
VALUES ('schema_version', '1');

CREATE TABLE IF NOT EXISTS import_batches (
    id INTEGER PRIMARY KEY,
    batch_key TEXT NOT NULL UNIQUE,
    source_file TEXT NOT NULL,
    source_hash TEXT NOT NULL,
    source_size_bytes INTEGER NOT NULL,
    source_modified_at TEXT,
    imported_at TEXT NOT NULL,
    source_sheet TEXT NOT NULL,
    source_table TEXT NOT NULL,
    rows_seen INTEGER NOT NULL DEFAULT 0,
    rows_loaded INTEGER NOT NULL DEFAULT 0,
    rows_rejected INTEGER NOT NULL DEFAULT 0,
    rows_deduplicated INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('running', 'success', 'failed')),
    message TEXT
);

CREATE INDEX IF NOT EXISTS idx_import_batches_hash
ON import_batches(source_hash, status);

CREATE TABLE IF NOT EXISTS source_rows (
    id INTEGER PRIMARY KEY,
    import_batch_id INTEGER NOT NULL REFERENCES import_batches(id) ON DELETE CASCADE,
    source_sheet TEXT NOT NULL,
    source_table TEXT NOT NULL,
    source_row INTEGER NOT NULL,
    source_row_hash TEXT NOT NULL,
    raw_payload_json TEXT NOT NULL,
    formula_payload_json TEXT NOT NULL,
    UNIQUE(import_batch_id, source_sheet, source_table, source_row),
    UNIQUE(import_batch_id, source_row_hash)
);

CREATE TABLE IF NOT EXISTS master_items (
    id INTEGER PRIMARY KEY,
    import_batch_id INTEGER NOT NULL REFERENCES import_batches(id),
    source_row_id INTEGER NOT NULL UNIQUE REFERENCES source_rows(id),
    source_excel_row INTEGER NOT NULL,
    product_code_raw TEXT NOT NULL,
    product_code TEXT NOT NULL,
    product_code_normalized TEXT NOT NULL UNIQUE,
    product_status TEXT,
    date_created TEXT,
    supplied_by TEXT,
    route_id TEXT,
    category TEXT,
    application TEXT,
    product_layers TEXT,
    product_category TEXT,
    customer_name TEXT,
    product_name TEXT,
    label_width_mm REAL,
    label_height_mm REAL,
    ups INTEGER,
    colour_quant_raw TEXT,
    colour_quantity INTEGER NOT NULL,
    slitting_size REAL,
    roll_length_m REAL,
    print_material TEXT,
    print_film_width REAL,
    print_film_thickness_um_raw REAL,
    print_film_thickness_um REAL,
    print_film_density REAL,
    barrier1_film_width REAL,
    barrier1_thickness_um REAL,
    barrier1_density REAL,
    barrier2_film_width REAL,
    barrier2_thickness_um REAL,
    barrier2_density REAL,
    sealant_film_width REAL,
    sealant_thickness_um REAL,
    sealant_density REAL,
    l1p1t1 REAL NOT NULL,
    l2p2t2 REAL NOT NULL,
    l3p3t3 REAL NOT NULL,
    l4p4t4 REAL NOT NULL,
    lpt REAL NOT NULL,
    m2r REAL,
    m2p REAL,
    l1p1t1w1 REAL,
    l2p2t2w2 REAL,
    l3p3t3w3 REAL,
    l4p4t4w4 REAL,
    pcs_kg REAL NOT NULL,
    m_kg REAL NOT NULL,
    jm_kg REAL NOT NULL,
    pt_kg REAL NOT NULL,
    process_51_printing INTEGER NOT NULL CHECK (process_51_printing IN (0, 1)),
    process_52_laminating INTEGER NOT NULL CHECK (process_52_laminating IN (0, 1)),
    process_53_slitting INTEGER NOT NULL CHECK (process_53_slitting IN (0, 1)),
    process_54_seaming INTEGER NOT NULL CHECK (process_54_seaming IN (0, 1)),
    process_55_inspecting INTEGER NOT NULL CHECK (process_55_inspecting IN (0, 1)),
    process_56_cutting INTEGER NOT NULL CHECK (process_56_cutting IN (0, 1)),
    process_57_packing INTEGER NOT NULL CHECK (process_57_packing IN (0, 1)),
    calculation_warnings_json TEXT NOT NULL,
    raw_payload_json TEXT NOT NULL,
    imported_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_master_items_customer
ON master_items(customer_name);

CREATE INDEX IF NOT EXISTS idx_master_items_route
ON master_items(route_id);

CREATE INDEX IF NOT EXISTS idx_master_items_status
ON master_items(product_status);

CREATE INDEX IF NOT EXISTS idx_master_items_category
ON master_items(product_category);

CREATE TABLE IF NOT EXISTS import_rejections (
    id INTEGER PRIMARY KEY,
    import_batch_id INTEGER NOT NULL REFERENCES import_batches(id) ON DELETE CASCADE,
    source_row_id INTEGER REFERENCES source_rows(id) ON DELETE CASCADE,
    source_row INTEGER NOT NULL,
    product_code_raw TEXT,
    severity TEXT NOT NULL CHECK (severity IN ('warning', 'rejected')),
    rule_code TEXT NOT NULL,
    reason TEXT NOT NULL,
    raw_payload_json TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_import_rejections_batch
ON import_rejections(import_batch_id, severity, rule_code);
