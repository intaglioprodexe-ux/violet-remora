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
  pingHistoryDatabase
};
