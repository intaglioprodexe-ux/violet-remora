const crypto = require("node:crypto");
const path = require("node:path");
const express = require("express");

const { createHistoryRouter } = require("./routes/history.routes");
const { createMasterlistRouter } = require("./routes/masterlist.routes");
const { listHistoryObjects, pingHistoryDatabase } = require("./db/history-db");

function createRequestId() {
  return crypto.randomUUID();
}

function addRequestId(req, res, next) {
  const supplied = req.get("x-request-id");
  const requestId = supplied && /^[A-Za-z0-9._:-]{1,100}$/.test(supplied)
    ? supplied
    : createRequestId();

  req.requestId = requestId;
  res.set("x-request-id", requestId);
  next();
}

function addConfiguredCors(frontendOrigin) {
  return (req, res, next) => {
    const requestOrigin = req.get("origin");

    if (frontendOrigin && requestOrigin === frontendOrigin) {
      res.set("access-control-allow-origin", frontendOrigin);
      res.set("vary", "Origin");
      res.set("access-control-allow-headers", "Content-Type, X-Request-Id, X-Schema-Inspection-Token");
      res.set("access-control-allow-methods", "GET, OPTIONS");
    }

    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }

    next();
  };
}

function sendError(res, status, code, message, requestId) {
  return res.status(status).json({
    error: {
      code,
      message,
      request_id: requestId
    }
  });
}

function createApp({
  config,
  historyDatabase,
  liveScheduleDatabase,
  masterlistDatabase
}) {
  const app = express();
  const projectRoot = path.resolve(__dirname, "../..");
  const frontendSourceRoot = path.join(projectRoot, "src");
  const frontendIndexPath = path.join(projectRoot, "index.html");

  app.disable("x-powered-by");
  app.use(addRequestId);
  app.use(addConfiguredCors(config.frontendOrigin));
  app.use(express.json({ limit: "1mb" }));

  app.get("/", (req, res, next) => {
    res.sendFile(frontendIndexPath, (error) => {
      if (error) {
        next(error);
      }
    });
  });

  app.use("/src", express.static(frontendSourceRoot));

  app.get("/api/v1/health", (req, res, next) => {
    try {
      const connected = pingHistoryDatabase(historyDatabase);
      const liveConnected = pingHistoryDatabase(liveScheduleDatabase);
      const masterlistConnected = pingHistoryDatabase(masterlistDatabase);
      const objects = connected ? listHistoryObjects(historyDatabase) : [];
      const liveObjects = liveConnected ? listHistoryObjects(liveScheduleDatabase) : [];
      const masterlistObjects = masterlistConnected
        ? listHistoryObjects(masterlistDatabase)
        : [];

      res.json({
        data: {
          status: connected ? "ok" : "degraded",
          history_database: {
            connected,
            read_only: true,
            object_count: objects.length
          },
          live_schedule_database: {
            connected: liveConnected,
            read_only: true,
            object_count: liveObjects.length
          },
          masterlist_database: {
            connected: masterlistConnected,
            read_only: true,
            object_count: masterlistObjects.length
          }
        },
        meta: {
          request_id: req.requestId
        }
      });
    } catch (error) {
      next(error);
    }
  });

  app.use(
    "/api/v1/history",
    createHistoryRouter({
      database: historyDatabase,
      liveScheduleDatabase,
      schemaInspectionToken: config.schemaInspectionToken,
      nodeEnv: config.nodeEnv
    })
  );

  app.use(
    "/api/v1/masterlist",
    createMasterlistRouter({ database: masterlistDatabase })
  );

  app.get(/^\/(?!api(?:\/|$)).*/, (req, res, next) => {
    res.sendFile(frontendIndexPath, (error) => {
      if (error) {
        next(error);
      }
    });
  });

  app.use((req, res) => {
    sendError(
      res,
      404,
      "NOT_FOUND",
      "The requested endpoint does not exist.",
      req.requestId
    );
  });

  app.use((error, req, res, next) => {
    if (res.headersSent) {
      next(error);
      return;
    }

    if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
      sendError(
        res,
        400,
        "INVALID_JSON",
        "The request body contains invalid JSON.",
        req.requestId
      );
      return;
    }

    console.error(`[${req.requestId}]`, error);
    sendError(
      res,
      500,
      "INTERNAL_ERROR",
      "The server could not complete the request.",
      req.requestId
    );
  });

  return app;
}

module.exports = {
  createApp
};
