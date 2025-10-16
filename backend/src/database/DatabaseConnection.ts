import { Sequelize } from "sequelize-typescript";
import { databaseCircuitBreaker } from "../config/circuitBreakers";
import { logger } from "../utils/logger";

export class DatabaseConnection {
  private sequelize: Sequelize;

  constructor(sequelize: Sequelize) {
    this.sequelize = sequelize;
  }

  async query<T = any>(sql: string, options?: any): Promise<T> {
    return databaseCircuitBreaker.execute(async () => {
      try {
        const result = await this.sequelize.query(sql, options);
        return result as T;
      } catch (error) {
        logger.error("Database query error", { sql, error });
        throw error;
      }
    });
  }

  async authenticate(): Promise<void> {
    return databaseCircuitBreaker.execute(async () => {
      await this.sequelize.authenticate();
      logger.info("Database connection authenticated successfully");
    });
  }

  async transaction<T>(callback: (t: any) => Promise<T>): Promise<T> {
    return databaseCircuitBreaker.execute(async () => {
      return await this.sequelize.transaction(callback);
    });
  }

  async healthCheck(): Promise<boolean> {
    try {
      await databaseCircuitBreaker.execute(async () => {
        await this.sequelize.authenticate();
      });
      return true;
    } catch (error) {
      logger.error("Database health check failed", { error });
      return false;
    }
  }

  getPoolStats() {
    const pool = (this.sequelize as any).connectionManager?.pool;
    if (!pool) {
      return null;
    }

    return {
      size: pool.size || 0,
      available: pool.available || 0,
      using: pool.using || 0,
      waiting: pool.waiting || 0
    };
  }

  async close(): Promise<void> {
    await this.sequelize.close();
    logger.info("Database connection closed");
  }
}
