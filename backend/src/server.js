const { config } = require("./config");
const {
  closeHistoryDatabase,
  openLiveScheduleDatabase,
  openHistoryDatabase
} = require("./db/history-db");
const { createApp } = require("./app");

let historyDatabase;
let liveScheduleDatabase;
let server;

function start() {
  try {
    historyDatabase = openHistoryDatabase(config.historyDbPath);
    liveScheduleDatabase = openLiveScheduleDatabase(config.liveScheduleDbPath);
  } catch (error) {
    console.error("Could not open the history SQLite database.");
    console.error(`Configured path: ${config.historyDbPath}`);
    console.error(`Live schedule path: ${config.liveScheduleDbPath}`);
    console.error(error.message);
    process.exitCode = 1;
    return;
  }

  const app = createApp({
    config,
    historyDatabase,
    liveScheduleDatabase
  });

  server = app.listen(config.port, config.host, () => {
    console.log(`violet-remora backend listening at http://${config.host}:${config.port}`);
    console.log("History database opened in read-only mode.");
  });

  server.on("error", (error) => {
    console.error("The HTTP server failed.");
    console.error(error.message);
    shutdown("server-error");
  });
}

function shutdown(signal) {
  console.log(`Shutting down because of ${signal}.`);

  const finish = () => {
    closeHistoryDatabase(historyDatabase);
    closeHistoryDatabase(liveScheduleDatabase);
    process.exit(0);
  };

  if (!server) {
    finish();
    return;
  }

  server.close(finish);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

start();
