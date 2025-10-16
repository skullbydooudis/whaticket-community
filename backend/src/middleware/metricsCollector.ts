import { Request, Response, NextFunction } from "express";
import redisClient from "../config/redis";
import logger from "../utils/logger";

interface RequestMetrics {
  path: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: number;
  userId?: number;
  ip: string;
  userAgent?: string;
}

class MetricsCollector {
  private metricsBuffer: RequestMetrics[] = [];
  private bufferSize: number = 100;
  private flushInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startFlushInterval();
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const startTime = Date.now();

      res.on("finish", () => {
        const responseTime = Date.now() - startTime;

        const metrics: RequestMetrics = {
          path: req.path,
          method: req.method,
          statusCode: res.statusCode,
          responseTime,
          timestamp: Date.now(),
          userId: req.user?.id,
          ip: req.ip || req.connection.remoteAddress || "unknown",
          userAgent: req.get("user-agent")
        };

        this.collect(metrics);
      });

      next();
    };
  }

  private collect(metrics: RequestMetrics): void {
    this.metricsBuffer.push(metrics);

    this.updateRealTimeMetrics(metrics).catch(error => {
      logger.error("Error updating real-time metrics:", error);
    });

    if (this.metricsBuffer.length >= this.bufferSize) {
      this.flush().catch(error => {
        logger.error("Error flushing metrics buffer:", error);
      });
    }
  }

  private async updateRealTimeMetrics(metrics: RequestMetrics): Promise<void> {
    if (!redisClient.isReady()) {
      return;
    }

    try {
      await redisClient.incr("metrics:requests:total");

      if (metrics.statusCode < 400) {
        await redisClient.incr("metrics:requests:success");
      } else {
        await redisClient.incr("metrics:requests:error");
      }

      const avgTimeKey = "metrics:requests:avgtime";
      const currentAvg = await redisClient.get(avgTimeKey);
      const newAvg = currentAvg
        ? (parseFloat(currentAvg) + metrics.responseTime) / 2
        : metrics.responseTime;

      await redisClient.set(avgTimeKey, newAvg.toString(), 3600);

      const endpointKey = `metrics:endpoint:${metrics.method}:${metrics.path}`;
      await redisClient.incr(endpointKey);
      await redisClient.expire(endpointKey, 86400);

      const statusKey = `metrics:status:${metrics.statusCode}`;
      await redisClient.incr(statusKey);
      await redisClient.expire(statusKey, 86400);

      const slowRequestThreshold = 1000;
      if (metrics.responseTime > slowRequestThreshold) {
        const slowRequestKey = `metrics:slow:${Date.now()}`;
        await redisClient.setJSON(slowRequestKey, metrics, 86400);
      }
    } catch (error) {
      logger.error("Error updating real-time metrics:", error);
    }
  }

  private async flush(): Promise<void> {
    if (this.metricsBuffer.length === 0) {
      return;
    }

    const metricsToFlush = [...this.metricsBuffer];
    this.metricsBuffer = [];

    try {
      await this.persistMetrics(metricsToFlush);
      logger.debug(`Flushed ${metricsToFlush.length} metrics`);
    } catch (error) {
      logger.error("Error flushing metrics:", error);
      this.metricsBuffer.push(...metricsToFlush);
    }
  }

  private async persistMetrics(metrics: RequestMetrics[]): Promise<void> {
    if (!redisClient.isReady()) {
      logger.warn("Redis not ready, skipping metrics persistence");
      return;
    }

    try {
      const timestamp = Date.now();
      const metricsKey = `metrics:batch:${timestamp}`;

      await redisClient.setJSON(metricsKey, metrics, 86400);

      for (const metric of metrics) {
        const hourKey = this.getHourKey(metric.timestamp);
        await redisClient.lpush(`metrics:hourly:${hourKey}`, JSON.stringify(metric));
        await redisClient.expire(`metrics:hourly:${hourKey}`, 604800);
      }
    } catch (error) {
      logger.error("Error persisting metrics:", error);
      throw error;
    }
  }

  private getHourKey(timestamp: number): string {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}`;
  }

  private startFlushInterval(): void {
    const flushIntervalMs = 60000;

    this.flushInterval = setInterval(() => {
      this.flush().catch(error => {
        logger.error("Error in flush interval:", error);
      });
    }, flushIntervalMs);
  }

  async getMetricsSummary(hours: number = 24): Promise<any> {
    try {
      const now = Date.now();
      const startTime = now - hours * 60 * 60 * 1000;

      const keys: string[] = [];
      for (let i = 0; i < hours; i++) {
        const hourTimestamp = now - i * 60 * 60 * 1000;
        const hourKey = this.getHourKey(hourTimestamp);
        keys.push(`metrics:hourly:${hourKey}`);
      }

      const metricsData: RequestMetrics[] = [];
      for (const key of keys) {
        const data = await redisClient.lrange(key, 0, -1);
        const parsed = data.map(item => JSON.parse(item));
        metricsData.push(...parsed);
      }

      const summary = this.calculateSummary(metricsData);

      return summary;
    } catch (error) {
      logger.error("Error getting metrics summary:", error);
      throw error;
    }
  }

  private calculateSummary(metrics: RequestMetrics[]): any {
    if (metrics.length === 0) {
      return {
        total: 0,
        success: 0,
        error: 0,
        averageResponseTime: 0,
        minResponseTime: 0,
        maxResponseTime: 0,
        requestsByMethod: {},
        requestsByStatus: {},
        topEndpoints: []
      };
    }

    const successMetrics = metrics.filter(m => m.statusCode < 400);
    const errorMetrics = metrics.filter(m => m.statusCode >= 400);

    const responseTimes = metrics.map(m => m.responseTime);
    const avgResponseTime =
      responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const minResponseTime = Math.min(...responseTimes);
    const maxResponseTime = Math.max(...responseTimes);

    const requestsByMethod: Record<string, number> = {};
    const requestsByStatus: Record<number, number> = {};
    const endpointCounts: Record<string, number> = {};

    metrics.forEach(m => {
      requestsByMethod[m.method] = (requestsByMethod[m.method] || 0) + 1;
      requestsByStatus[m.statusCode] = (requestsByStatus[m.statusCode] || 0) + 1;

      const endpoint = `${m.method} ${m.path}`;
      endpointCounts[endpoint] = (endpointCounts[endpoint] || 0) + 1;
    });

    const topEndpoints = Object.entries(endpointCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([endpoint, count]) => ({ endpoint, count }));

    return {
      total: metrics.length,
      success: successMetrics.length,
      error: errorMetrics.length,
      averageResponseTime: Math.round(avgResponseTime),
      minResponseTime,
      maxResponseTime,
      requestsByMethod,
      requestsByStatus,
      topEndpoints
    };
  }

  async getSlowRequests(limit: number = 100): Promise<RequestMetrics[]> {
    try {
      const pattern = "metrics:slow:*";
      const keys = await redisClient.getClient().keys(pattern);

      const slowRequests: RequestMetrics[] = [];
      for (const key of keys.slice(0, limit)) {
        const data = await redisClient.getJSON<RequestMetrics>(key);
        if (data) {
          slowRequests.push(data);
        }
      }

      return slowRequests.sort((a, b) => b.responseTime - a.responseTime);
    } catch (error) {
      logger.error("Error getting slow requests:", error);
      return [];
    }
  }

  async cleanup(): Promise<void> {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }

    await this.flush();
    logger.info("Metrics collector cleaned up");
  }
}

const metricsCollector = new MetricsCollector();

export default metricsCollector;
export { MetricsCollector, RequestMetrics };
