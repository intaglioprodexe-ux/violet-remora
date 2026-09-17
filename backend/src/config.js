const DEFAULT_HISTORY_DB_PATH = "\\\\192.168.0.254\\Public\\violet-remora\\job_history_2023_2025.sqlite";

function readPort(value) {
  const port = Number(value || 3000);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }

  return port;
}

const config = {
  host: process.env.HOST || "127.0.0.1",
  port: readPort(process.env.PORT),
  nodeEnv: process.env.NODE_ENV || "development",
  historyDbPath: process.env.HISTORY_DB_PATH || DEFAULT_HISTORY_DB_PATH,
  schemaInspectionToken: process.env.SCHEMA_INSPECTION_TOKEN || "",
  frontendOrigin: process.env.FRONTEND_ORIGIN || ""
};

module.exports = {
  config,
  DEFAULT_HISTORY_DB_PATH
};
