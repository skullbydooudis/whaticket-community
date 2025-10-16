import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";

export interface RequestWithCorrelation extends Request {
  correlationId: string;
}

export const correlationIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const correlationId =
    (req.headers["x-correlation-id"] as string) ||
    (req.headers["x-request-id"] as string) ||
    uuidv4();

  (req as RequestWithCorrelation).correlationId = correlationId;

  res.setHeader("X-Correlation-ID", correlationId);
  res.setHeader("X-Request-ID", correlationId);

  next();
};

export const getCorrelationId = (req: Request): string => {
  return (req as RequestWithCorrelation).correlationId || "unknown";
};
