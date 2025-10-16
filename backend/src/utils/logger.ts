import pino from "pino";
import { AsyncLocalStorage } from "async_hooks";

interface LogContext {
  correlationId?: string;
  userId?: number;
  requestPath?: string;
  requestMethod?: string;
}

export const logContext = new AsyncLocalStorage<LogContext>();

const isDevelopment = process.env.NODE_ENV !== "production";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  formatters: {
    level: (label) => {
      return { level: label };
    }
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    env: process.env.NODE_ENV || "development",
    service: "real-estate-crm-backend"
  },
  mixin() {
    const context = logContext.getStore();
    if (!context) return {};

    return {
      correlationId: context.correlationId,
      userId: context.userId,
      requestPath: context.requestPath,
      requestMethod: context.requestMethod
    };
  },
  transport: isDevelopment
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss Z",
          ignore: "pid,hostname"
        }
      }
    : undefined
});

export { logger };

export const setLogContext = (context: LogContext): void => {
  const currentContext = logContext.getStore() || {};
  logContext.enterWith({ ...currentContext, ...context });
};

export const getLogContext = (): LogContext | undefined => {
  return logContext.getStore();
};
