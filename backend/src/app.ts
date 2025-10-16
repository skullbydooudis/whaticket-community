import "./bootstrap";
import "reflect-metadata";
import "express-async-errors";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import * as Sentry from "@sentry/node";

import "./database";
import uploadConfig from "./config/upload";
import routes from "./routes";
import { logger } from "./utils/logger";

import { handleErrors, notFoundHandler } from "./middleware/errorHandler";
import { globalRateLimiter } from "./middleware/rateLimiter";
import { sanitizeMiddleware } from "./middleware/validation";
import metricsCollector from "./middleware/metricsCollector";
import { correlationIdMiddleware } from "./middleware/correlationId";
import { requestLoggerMiddleware } from "./middleware/requestLogger";
import HealthController from "./controllers/HealthController";

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true })
    ]
  });
}

const app = express();

app.set("trust proxy", 1);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.FRONTEND_URL || "*"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: {
    action: "deny"
  },
  noSniff: true,
  xssFilter: true
}));

app.use(
  cors({
    credentials: true,
    origin: function (origin, callback) {
      const allowedOrigins = process.env.CORS_ORIGINS
        ? process.env.CORS_ORIGINS.split(",")
        : [process.env.FRONTEND_URL || "http://localhost:3000"];

      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    }
  })
);

app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
}

app.use(correlationIdMiddleware);

app.use(requestLoggerMiddleware);

app.use(metricsCollector.middleware());

app.use(globalRateLimiter.middleware());

app.use(sanitizeMiddleware);

app.get("/health", HealthController.index);
app.get("/health/liveness", HealthController.liveness);
app.get("/health/readiness", HealthController.readiness);
app.get("/health/metrics", HealthController.metrics);

app.use("/public", express.static(uploadConfig.directory));

app.use(routes);

if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler());
}

app.use(notFoundHandler);
app.use(handleErrors);

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", { promise, reason });

  if (process.env.SENTRY_DSN) {
    Sentry.captureException(reason);
  }
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);

  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error);
  }

  process.exit(1);
});

export default app;
