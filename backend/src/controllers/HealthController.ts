import { Request, Response } from "express";
import { Sequelize } from "sequelize-typescript";
import redisClient from "../config/redis";
import logger from "../utils/logger";

interface HealthCheck {
  status: "healthy" | "unhealthy" | "degraded";
  timestamp: string;
  uptime: number;
  services: {
    database: ServiceStatus;
    redis: ServiceStatus;
    memory: MemoryStatus;
    disk: DiskStatus;
  };
  version: string;
  environment: string;
}

interface ServiceStatus {
  status: "up" | "down" | "degraded";
  responseTime?: number;
  error?: string;
  details?: any;
}

interface MemoryStatus extends ServiceStatus {
  used: number;
  total: number;
  percentage: number;
}

interface DiskStatus extends ServiceStatus {
  used: number;
  total: number;
  percentage: number;
}

interface MetricsData {
  timestamp: string;
  system: {
    cpuUsage: number;
    memoryUsage: number;
    uptime: number;
    nodeVersion: string;
  };
  process: {
    pid: number;
    memory: NodeJS.MemoryUsage;
    cpu: NodeJS.CpuUsage;
  };
  requests: {
    total: number;
    success: number;
    error: number;
    averageResponseTime: number;
  };
}

class HealthController {
  async index(req: Request, res: Response): Promise<Response> {
    try {
      const health = await this.performHealthCheck();
      const statusCode = health.status === "healthy" ? 200 : 503;

      return res.status(statusCode).json(health);
    } catch (error) {
      logger.error("Health check error:", error);

      return res.status(503).json({
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  }

  async liveness(req: Request, res: Response): Promise<Response> {
    return res.status(200).json({
      status: "alive",
      timestamp: new Date().toISOString()
    });
  }

  async readiness(req: Request, res: Response): Promise<Response> {
    try {
      const dbStatus = await this.checkDatabase();
      const redisStatus = await this.checkRedis();

      const isReady =
        dbStatus.status === "up" && redisStatus.status === "up";

      return res.status(isReady ? 200 : 503).json({
        status: isReady ? "ready" : "not ready",
        timestamp: new Date().toISOString(),
        services: {
          database: dbStatus,
          redis: redisStatus
        }
      });
    } catch (error) {
      logger.error("Readiness check error:", error);

      return res.status(503).json({
        status: "not ready",
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  }

  async metrics(req: Request, res: Response): Promise<Response> {
    try {
      const metrics = await this.collectMetrics();
      return res.status(200).json(metrics);
    } catch (error) {
      logger.error("Metrics collection error:", error);

      return res.status(500).json({
        error: "Failed to collect metrics",
        message: error.message
      });
    }
  }

  private async performHealthCheck(): Promise<HealthCheck> {
    const startTime = Date.now();

    const [dbStatus, redisStatus, memoryStatus] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkMemory()
    ]);

    const diskStatus = this.checkDisk();

    const allServicesUp =
      dbStatus.status === "up" &&
      redisStatus.status === "up" &&
      memoryStatus.status !== "down" &&
      diskStatus.status !== "down";

    const anyServiceDegraded =
      dbStatus.status === "degraded" ||
      redisStatus.status === "degraded" ||
      memoryStatus.status === "degraded" ||
      diskStatus.status === "degraded";

    let overallStatus: "healthy" | "unhealthy" | "degraded";
    if (allServicesUp && !anyServiceDegraded) {
      overallStatus = "healthy";
    } else if (anyServiceDegraded) {
      overallStatus = "degraded";
    } else {
      overallStatus = "unhealthy";
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: dbStatus,
        redis: redisStatus,
        memory: memoryStatus,
        disk: diskStatus
      },
      version: process.env.APP_VERSION || "1.0.0",
      environment: process.env.NODE_ENV || "development"
    };
  }

  private async checkDatabase(): Promise<ServiceStatus> {
    const startTime = Date.now();

    try {
      const sequelize = require("../database").default as Sequelize;
      await sequelize.authenticate();

      const responseTime = Date.now() - startTime;

      return {
        status: responseTime > 1000 ? "degraded" : "up",
        responseTime,
        details: {
          dialect: sequelize.getDialect(),
          pool: {
            size: (sequelize as any).connectionManager.pool.size,
            available: (sequelize as any).connectionManager.pool.available
          }
        }
      };
    } catch (error) {
      logger.error("Database health check failed:", error);

      return {
        status: "down",
        responseTime: Date.now() - startTime,
        error: error.message
      };
    }
  }

  private async checkRedis(): Promise<ServiceStatus> {
    const startTime = Date.now();

    try {
      const isConnected = await redisClient.ping();

      if (!isConnected) {
        throw new Error("Redis ping failed");
      }

      const responseTime = Date.now() - startTime;

      return {
        status: responseTime > 500 ? "degraded" : "up",
        responseTime,
        details: {
          connected: isConnected
        }
      };
    } catch (error) {
      logger.error("Redis health check failed:", error);

      return {
        status: "down",
        responseTime: Date.now() - startTime,
        error: error.message
      };
    }
  }

  private async checkMemory(): Promise<MemoryStatus> {
    const usage = process.memoryUsage();
    const totalMemory = require("os").totalmem();
    const usedMemory = usage.heapUsed;
    const percentage = (usedMemory / totalMemory) * 100;

    let status: "up" | "degraded" | "down";
    if (percentage < 70) {
      status = "up";
    } else if (percentage < 90) {
      status = "degraded";
    } else {
      status = "down";
    }

    return {
      status,
      used: usedMemory,
      total: totalMemory,
      percentage: Math.round(percentage * 100) / 100,
      details: {
        heapTotal: usage.heapTotal,
        heapUsed: usage.heapUsed,
        external: usage.external,
        rss: usage.rss
      }
    };
  }

  private checkDisk(): DiskStatus {
    try {
      const fs = require("fs");
      const stats = fs.statfsSync("/");

      const total = stats.blocks * stats.bsize;
      const used = (stats.blocks - stats.bfree) * stats.bsize;
      const percentage = (used / total) * 100;

      let status: "up" | "degraded" | "down";
      if (percentage < 80) {
        status = "up";
      } else if (percentage < 95) {
        status = "degraded";
      } else {
        status = "down";
      }

      return {
        status,
        used,
        total,
        percentage: Math.round(percentage * 100) / 100
      };
    } catch (error) {
      return {
        status: "up",
        used: 0,
        total: 0,
        percentage: 0,
        error: "Unable to check disk usage"
      };
    }
  }

  private async collectMetrics(): Promise<MetricsData> {
    const cpuUsage = process.cpuUsage();
    const memoryUsage = process.memoryUsage();

    const requestMetrics = await this.getRequestMetrics();

    return {
      timestamp: new Date().toISOString(),
      system: {
        cpuUsage: (cpuUsage.user + cpuUsage.system) / 1000000,
        memoryUsage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
        uptime: process.uptime(),
        nodeVersion: process.version
      },
      process: {
        pid: process.pid,
        memory: memoryUsage,
        cpu: cpuUsage
      },
      requests: requestMetrics
    };
  }

  private async getRequestMetrics() {
    try {
      const total = await redisClient.get("metrics:requests:total");
      const success = await redisClient.get("metrics:requests:success");
      const error = await redisClient.get("metrics:requests:error");
      const avgTime = await redisClient.get("metrics:requests:avgtime");

      return {
        total: parseInt(total || "0", 10),
        success: parseInt(success || "0", 10),
        error: parseInt(error || "0", 10),
        averageResponseTime: parseFloat(avgTime || "0")
      };
    } catch (error) {
      logger.error("Failed to get request metrics:", error);

      return {
        total: 0,
        success: 0,
        error: 0,
        averageResponseTime: 0
      };
    }
  }
}

export default new HealthController();
