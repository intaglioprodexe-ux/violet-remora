const express = require("express");

const {
  countMasterlistItems,
  searchMasterlistItems
} = require("../db/masterlist-db");

function errorResponse(res, status, code, message, requestId) {
  return res.status(status).json({
    error: {
      code,
      message,
      request_id: requestId
    }
  });
}

function createMasterlistRouter({ database }) {
  const router = express.Router();

  router.get("/items", (req, res, next) => {
    try {
      const productCode = String(req.query.product_code || "").trim();
      const limit = Number(req.query.limit || 25);

      if (!productCode) {
        errorResponse(
          res,
          422,
          "PRODUCT_CODE_REQUIRED",
          "The product_code query parameter is required.",
          req.requestId
        );
        return;
      }

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

      const items = searchMasterlistItems(database, productCode, limit);

      res.json({
        data: items,
        meta: {
          request_id: req.requestId,
          product_code: productCode,
          limit,
          count: items.length,
          database_count: countMasterlistItems(database)
        }
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = {
  createMasterlistRouter
};
