const express = require("express");

const {
  getHistorySchema,
  listHistoryObjects,
  pingHistoryDatabase,
  searchHistoryJobs
} = require("../db/history-db");

function errorResponse(res, status, code, message, requestId) {
  return res.status(status).json({
    error: {
      code,
      message,
      request_id: requestId
    }
  });
}

function createInspectionGuard({ token, nodeEnv }) {
  return (req, res, next) => {
    if (nodeEnv !== "production" && !token) {
      next();
      return;
    }

    if (!token) {
      errorResponse(
        res,
        404,
        "SCHEMA_INSPECTION_DISABLED",
        "Schema inspection is disabled until SCHEMA_INSPECTION_TOKEN is configured.",
        req.requestId
      );
      return;
    }

    if (req.get("x-schema-inspection-token") !== token) {
      errorResponse(
        res,
        403,
        "SCHEMA_INSPECTION_FORBIDDEN",
        "A valid schema inspection token is required.",
        req.requestId
      );
      return;
    }

    next();
  };
}

function createHistoryRouter({ database, schemaInspectionToken, nodeEnv }) {
  const router = express.Router();
  const inspectionGuard = createInspectionGuard({
    token: schemaInspectionToken,
    nodeEnv
  });

  router.get("/ping", (req, res, next) => {
    try {
      const connected = pingHistoryDatabase(database);

      res.json({
        data: {
          connected,
          read_only: true
        },
        meta: {
          request_id: req.requestId
        }
      });
    } catch (error) {
      next(error);
    }
  });

  router.get("/jobs", (req, res, next) => {
    try {
      const search = String(req.query.search || "").trim();
      const limit = Number(req.query.limit || 25);
      const offset = Number(req.query.offset || 0);

      if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
        errorResponse(
          res,
          422,
          "INVALID_LIMIT",
          "The limit must be an integer between 1 and 100.",
          req.requestId
        );
        return;
      }

      if (!Number.isInteger(offset) || offset < 0) {
        errorResponse(
          res,
          422,
          "INVALID_OFFSET",
          "The offset must be a non-negative integer.",
          req.requestId
        );
        return;
      }

      const jobs = searchHistoryJobs(database, search, limit, offset);

      res.json({
        data: jobs,
        meta: {
          request_id: req.requestId,
          search,
          limit,
          offset,
          count: jobs.length
        }
      });
    } catch (error) {
      next(error);
    }
  });

  router.get("/tables", inspectionGuard, (req, res, next) => {
    try {
      res.json({
        data: listHistoryObjects(database),
        meta: {
          request_id: req.requestId
        }
      });
    } catch (error) {
      next(error);
    }
  });

  router.get("/schema", inspectionGuard, (req, res, next) => {
    try {
      res.json({
        data: getHistorySchema(database),
        meta: {
          request_id: req.requestId
        }
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = {
  createHistoryRouter
};
