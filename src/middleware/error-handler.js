import { MongoError } from "mongodb";

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({
      success: false,
      error: { code: "INVALID_JSON", message: "Request body must be valid JSON." },
    });
  }

  if (error instanceof ApiError) {
    return res.status(error.status).json({
      success: false,
      error: { code: error.code, message: error.message },
    });
  }

  if (error instanceof MongoError) {
    return res.status(503).json({
      success: false,
      error: { code: "DATABASE_UNAVAILABLE", message: "The database is temporarily unavailable." },
    });
  }

  console.error("Unhandled request error", { name: error?.name || "Error", path: req.path });
  return res.status(500).json({
    success: false,
    error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." },
  });
}
