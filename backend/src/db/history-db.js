const { DatabaseSync } = require("node:sqlite");

function openHistoryDatabase(databasePath) {
  if (!databasePath) {
    throw new Error("A history SQLite database path is required.");
  }

  const database = new DatabaseSync(databasePath, {
    readOnly: true,
    timeout: 5000
  });

  // Keep this connection read-only even if a future route is accidentally
  // changed to execute a write statement.
  database.exec("PRAGMA query_only = ON;");
  database.exec("PRAGMA busy_timeout = 5000;");

  return database;
}

function pingHistoryDatabase(database) {
  const row = database.prepare("SELECT 1 AS ok").get();
  return row && row.ok === 1;
}

function listHistoryObjects(database) {
  return database
    .prepare(
      `
        SELECT
          name,
          type
        FROM sqlite_master
        WHERE type IN ('table', 'view')
          AND name NOT LIKE 'sqlite_%'
        ORDER BY type, name
      `
    )
    .all();
}

function quoteIdentifier(identifier) {
  return `"${String(identifier).replaceAll('"', '""')}"`;
}

function getColumns(database, objectName) {
  const safeName = quoteIdentifier(objectName);

  return database
    .prepare(`PRAGMA table_info(${safeName})`)
    .all()
    .map((column) => ({
      column_id: column.cid,
      name: column.name,
      declared_type: column.type,
      not_null: Boolean(column.notnull),
      default_value: column.dflt_value,
      is_primary_key: Boolean(column.pk)
    }));
}

function getHistorySchema(database) {
  const objects = listHistoryObjects(database);

  return objects.map((object) => ({
    name: object.name,
    type: object.type,
    columns: getColumns(database, object.name)
  }));
}

function searchHistoryJobs(database, search, limit, offset) {
  const normalizedSearch = String(search || "").trim();
  const safeLimit = Math.min(Math.max(Number(limit) || 25, 1), 100);
  const safeOffset = Math.max(Number(offset) || 0, 0);

  if (!normalizedSearch) {
    return database
      .prepare(
        `
          SELECT
            id,
            jobcard_raw,
            jobcard_normalized,
            jobcard_last4,
            product_code,
            customer_name,
            product_name,
            order_qty,
            meter_run,
            status,
            printing_machine,
            printing_date,
            source_file,
            source_sheet,
            source_row
          FROM job_history_lookup
          ORDER BY id DESC
          LIMIT ? OFFSET ?
        `
      )
      .all(safeLimit, safeOffset);
  }

  const searchPattern = `%${normalizedSearch}%`;

  return database
    .prepare(
      `
        SELECT
          id,
          jobcard_raw,
          jobcard_normalized,
          jobcard_last4,
          product_code,
          customer_name,
          product_name,
          order_qty,
          meter_run,
          status,
          printing_machine,
          printing_date,
          source_file,
          source_sheet,
          source_row
        FROM job_history_lookup
        WHERE jobcard_last4 LIKE ?
           OR jobcard_normalized LIKE ?
           OR jobcard_raw LIKE ?
           OR product_code LIKE ?
           OR customer_name LIKE ?
           OR product_name LIKE ?
        ORDER BY
          CASE WHEN jobcard_last4 = ? THEN 0 ELSE 1 END,
          id DESC
        LIMIT ? OFFSET ?
      `
    )
    .all(
      searchPattern,
      searchPattern,
      searchPattern,
      searchPattern,
      searchPattern,
      searchPattern,
      normalizedSearch,
      safeLimit,
      safeOffset
    );
}

function closeHistoryDatabase(database) {
  if (database) {
    database.close();
  }
}

module.exports = {
  closeHistoryDatabase,
  getHistorySchema,
  listHistoryObjects,
  openHistoryDatabase,
  pingHistoryDatabase,
  searchHistoryJobs
};
