import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { checkDatabase, ensureDatabaseReady } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import { errorHandler } from "./middleware/error-handler.js";
import { notFound } from "./middleware/not-found.js";
import { sendSuccess } from "./utils/api-response.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || origin === env.authUrl) return callback(null, true);
        return callback(null, false);
      },
      credentials: true,
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      maxAge: 600,
    }),
  );
  app.use(express.json({ limit: "100kb" }));

  async function requireDatabase(req, res, next) {
    try {
      await ensureDatabaseReady();
      return next();
    } catch {
      return res.status(503).json({
        success: false,
        error: { code: "DATABASE_UNAVAILABLE", message: "The database is temporarily unavailable." },
      });
    }
  }

  app.get("/api/health", async (req, res) => {
    try {
      await checkDatabase();
      return sendSuccess(res, { status: "ok", database: "connected" });
    } catch {
      return res.status(503).json({
        success: false,
        data: { status: "degraded", database: "unavailable" },
      });
    }
  });

  app.use("/api/auth", requireDatabase);
  app.use("/api/auth", authRoutes);
  app.use("/api/products", productRoutes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
