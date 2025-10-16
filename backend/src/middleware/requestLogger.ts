import { Request, Response, NextFunction } from "express";
import { logger, logContext, setLogContext } from "../utils/logger";
import { getCorrelationId } from "./correlationId";

export const requestLoggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();
  const correlationId = getCorrelationId(req);

  logContext.run(
    {
      correlationId,
      requestPath: req.path,
      requestMethod: req.method
    },
    () => {
      logger.info({
        msg: "Incoming request",
        method: req.method,
        path: req.path,
        query: req.query,
        ip: req.ip,
        userAgent: req.get("user-agent")
      });

      const originalSend = res.send;
      res.send = function (data: any): Response {
        res.send = originalSend;

        const duration = Date.now() - start;

        logger.info({
          msg: "Request completed",
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
          contentLength: res.get("content-length")
        });

        return res.send(data);
      };

      res.on("finish", () => {
        if (!res.headersSent) {
          const duration = Date.now() - start;
          logger.info({
            msg: "Request finished",
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration: `${duration}ms`
          });
        }
      });

      next();
    }
  );
};
