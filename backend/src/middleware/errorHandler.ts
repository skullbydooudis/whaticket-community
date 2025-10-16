import { Request, Response, NextFunction } from "express";
import { ValidationError } from "sequelize";
import AppError from "../errors/AppError";
import logger from "../utils/logger";

interface ErrorResponse {
  status: "error";
  message: string;
  code?: string;
  errors?: any[];
  stack?: string;
}

class ErrorHandler {
  static handle(
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
  ): Response {
    if (error instanceof AppError) {
      return ErrorHandler.handleAppError(error, req, res);
    }

    if (error instanceof ValidationError) {
      return ErrorHandler.handleValidationError(error, req, res);
    }

    if (error.name === "JsonWebTokenError") {
      return ErrorHandler.handleJWTError(error, req, res);
    }

    if (error.name === "TokenExpiredError") {
      return ErrorHandler.handleTokenExpiredError(error, req, res);
    }

    if (error.name === "MulterError") {
      return ErrorHandler.handleMulterError(error, req, res);
    }

    return ErrorHandler.handleUnknownError(error, req, res);
  }

  private static handleAppError(
    error: AppError,
    req: Request,
    res: Response
  ): Response {
    logger.warn("Application error:", {
      message: error.message,
      statusCode: error.statusCode,
      path: req.path,
      method: req.method,
      ip: req.ip,
      userId: req.user?.id
    });

    const response: ErrorResponse = {
      status: "error",
      message: error.message
    };

    if (process.env.NODE_ENV === "development") {
      response.stack = error.stack;
    }

    return res.status(error.statusCode).json(response);
  }

  private static handleValidationError(
    error: ValidationError,
    req: Request,
    res: Response
  ): Response {
    logger.warn("Validation error:", {
      errors: error.errors,
      path: req.path,
      method: req.method
    });

    const errors = error.errors.map(err => ({
      field: err.path,
      message: err.message,
      type: err.type,
      value: err.value
    }));

    const response: ErrorResponse = {
      status: "error",
      message: "Validation failed",
      errors
    };

    return res.status(400).json(response);
  }

  private static handleJWTError(
    error: Error,
    req: Request,
    res: Response
  ): Response {
    logger.warn("JWT error:", {
      message: error.message,
      path: req.path
    });

    const response: ErrorResponse = {
      status: "error",
      message: "Invalid token",
      code: "INVALID_TOKEN"
    };

    return res.status(401).json(response);
  }

  private static handleTokenExpiredError(
    error: Error,
    req: Request,
    res: Response
  ): Response {
    logger.warn("Token expired:", {
      path: req.path,
      userId: req.user?.id
    });

    const response: ErrorResponse = {
      status: "error",
      message: "Token expired",
      code: "TOKEN_EXPIRED"
    };

    return res.status(401).json(response);
  }

  private static handleMulterError(
    error: any,
    req: Request,
    res: Response
  ): Response {
    logger.warn("Multer error:", {
      message: error.message,
      code: error.code,
      field: error.field
    });

    let message = "File upload error";

    switch (error.code) {
      case "LIMIT_FILE_SIZE":
        message = "File too large";
        break;
      case "LIMIT_FILE_COUNT":
        message = "Too many files";
        break;
      case "LIMIT_UNEXPECTED_FILE":
        message = "Unexpected file field";
        break;
      case "LIMIT_PART_COUNT":
        message = "Too many parts";
        break;
    }

    const response: ErrorResponse = {
      status: "error",
      message,
      code: error.code
    };

    return res.status(400).json(response);
  }

  private static handleUnknownError(
    error: Error,
    req: Request,
    res: Response
  ): Response {
    logger.error("Unknown error:", {
      message: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
      body: req.body,
      query: req.query,
      params: req.params,
      userId: req.user?.id,
      ip: req.ip
    });

    const response: ErrorResponse = {
      status: "error",
      message:
        process.env.NODE_ENV === "production"
          ? "Internal server error"
          : error.message
    };

    if (process.env.NODE_ENV === "development") {
      response.stack = error.stack;
    }

    return res.status(500).json(response);
  }

  static notFound(req: Request, res: Response, next: NextFunction): void {
    const error = new AppError(
      `Route ${req.originalUrl} not found`,
      404
    );
    next(error);
  }

  static async shutdown(signal: string): Promise<void> {
    logger.info(`Received ${signal}, starting graceful shutdown...`);

    setTimeout(() => {
      logger.error("Forced shutdown after timeout");
      process.exit(1);
    }, 30000);

    try {
      logger.info("Graceful shutdown completed");
      process.exit(0);
    } catch (error) {
      logger.error("Error during shutdown:", error);
      process.exit(1);
    }
  }
}

export const handleErrors = ErrorHandler.handle.bind(ErrorHandler);
export const notFoundHandler = ErrorHandler.notFound.bind(ErrorHandler);
export const shutdownHandler = ErrorHandler.shutdown.bind(ErrorHandler);

export default ErrorHandler;
