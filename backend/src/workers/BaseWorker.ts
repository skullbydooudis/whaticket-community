import { EventEmitter } from "events";
import redisClient from "../config/redis";
import logger from "../utils/logger";

interface WorkerConfig {
  name: string;
  concurrency?: number;
  pollInterval?: number;
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
}

interface Job<T = any> {
  id: string;
  type: string;
  data: T;
  attempts: number;
  maxRetries: number;
  createdAt: number;
  processedAt?: number;
  completedAt?: number;
  failedAt?: number;
  error?: string;
}

interface JobResult {
  success: boolean;
  data?: any;
  error?: string;
}

abstract class BaseWorker<T = any> extends EventEmitter {
  protected config: Required<WorkerConfig>;
  protected isRunning: boolean = false;
  protected activeJobs: Set<string> = new Set();
  protected pollTimer: NodeJS.Timeout | null = null;

  constructor(config: WorkerConfig) {
    super();

    this.config = {
      name: config.name,
      concurrency: config.concurrency || 5,
      pollInterval: config.pollInterval || 1000,
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 5000,
      timeout: config.timeout || 300000
    };
  }

  abstract process(job: Job<T>): Promise<JobResult>;

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn(`Worker ${this.config.name} is already running`);
      return;
    }

    this.isRunning = true;
    logger.info(`Starting worker: ${this.config.name}`);

    this.poll();
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    logger.info(`Stopping worker: ${this.config.name}`);
    this.isRunning = false;

    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }

    await this.waitForActiveJobs();

    logger.info(`Worker ${this.config.name} stopped`);
  }

  private async poll(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      if (this.activeJobs.size < this.config.concurrency) {
        const availableSlots = this.config.concurrency - this.activeJobs.size;

        for (let i = 0; i < availableSlots; i++) {
          const job = await this.fetchJob();

          if (job) {
            this.executeJob(job).catch(error => {
              logger.error(`Error executing job ${job.id}:`, error);
            });
          }
        }
      }
    } catch (error) {
      logger.error(`Error polling jobs for worker ${this.config.name}:`, error);
    } finally {
      this.pollTimer = setTimeout(
        () => this.poll(),
        this.config.pollInterval
      );
    }
  }

  private async fetchJob(): Promise<Job<T> | null> {
    try {
      const queueKey = this.getQueueKey();
      const jobData = await redisClient.rpop(queueKey);

      if (!jobData) {
        return null;
      }

      const job: Job<T> = JSON.parse(jobData);
      return job;
    } catch (error) {
      logger.error(`Error fetching job:`, error);
      return null;
    }
  }

  private async executeJob(job: Job<T>): Promise<void> {
    this.activeJobs.add(job.id);
    job.processedAt = Date.now();

    logger.info(`Processing job ${job.id} (attempt ${job.attempts + 1}/${job.maxRetries})`);

    try {
      const timeoutPromise = new Promise<JobResult>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Job timeout after ${this.config.timeout}ms`));
        }, this.config.timeout);
      });

      const result = await Promise.race([
        this.process(job),
        timeoutPromise
      ]);

      if (result.success) {
        await this.handleSuccess(job, result);
      } else {
        await this.handleFailure(job, result.error || "Unknown error");
      }
    } catch (error) {
      await this.handleFailure(job, error.message);
    } finally {
      this.activeJobs.delete(job.id);
    }
  }

  private async handleSuccess(job: Job<T>, result: JobResult): Promise<void> {
    job.completedAt = Date.now();

    logger.info(`Job ${job.id} completed successfully`);

    await this.saveJobResult(job, result);

    this.emit("job:completed", { job, result });
  }

  private async handleFailure(job: Job<T>, error: string): Promise<void> {
    job.attempts++;
    job.error = error;

    logger.error(`Job ${job.id} failed:`, error);

    if (job.attempts < job.maxRetries) {
      logger.info(`Retrying job ${job.id} in ${this.config.retryDelay}ms`);

      setTimeout(() => {
        this.retryJob(job).catch(err => {
          logger.error(`Error retrying job ${job.id}:`, err);
        });
      }, this.config.retryDelay);

      this.emit("job:retry", { job, error });
    } else {
      job.failedAt = Date.now();

      logger.error(`Job ${job.id} failed permanently after ${job.attempts} attempts`);

      await this.saveFailedJob(job);

      this.emit("job:failed", { job, error });
    }
  }

  private async retryJob(job: Job<T>): Promise<void> {
    const queueKey = this.getQueueKey();
    await redisClient.lpush(queueKey, JSON.stringify(job));
  }

  private async saveJobResult(job: Job<T>, result: JobResult): Promise<void> {
    try {
      const resultKey = `job:result:${job.id}`;
      await redisClient.setJSON(resultKey, { job, result }, 86400);
    } catch (error) {
      logger.error(`Error saving job result:`, error);
    }
  }

  private async saveFailedJob(job: Job<T>): Promise<void> {
    try {
      const failedKey = `job:failed:${job.id}`;
      await redisClient.setJSON(failedKey, job, 604800);

      const failedQueueKey = this.getFailedQueueKey();
      await redisClient.lpush(failedQueueKey, JSON.stringify(job));
    } catch (error) {
      logger.error(`Error saving failed job:`, error);
    }
  }

  private async waitForActiveJobs(): Promise<void> {
    const maxWait = 30000;
    const startTime = Date.now();

    while (this.activeJobs.size > 0) {
      if (Date.now() - startTime > maxWait) {
        logger.warn(
          `Timeout waiting for active jobs, ${this.activeJobs.size} jobs still running`
        );
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  protected getQueueKey(): string {
    return `queue:${this.config.name}`;
  }

  protected getFailedQueueKey(): string {
    return `queue:${this.config.name}:failed`;
  }

  async addJob(type: string, data: T, options?: Partial<Job<T>>): Promise<string> {
    const job: Job<T> = {
      id: options?.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      attempts: 0,
      maxRetries: options?.maxRetries || this.config.maxRetries,
      createdAt: Date.now()
    };

    const queueKey = this.getQueueKey();
    await redisClient.lpush(queueKey, JSON.stringify(job));

    logger.info(`Job ${job.id} added to queue ${this.config.name}`);

    return job.id;
  }

  async getQueueSize(): Promise<number> {
    const queueKey = this.getQueueKey();
    const size = await redisClient.getClient().llen(queueKey);
    return size;
  }

  async getFailedQueueSize(): Promise<number> {
    const queueKey = this.getFailedQueueKey();
    const size = await redisClient.getClient().llen(queueKey);
    return size;
  }

  async getJobResult(jobId: string): Promise<{ job: Job<T>; result: JobResult } | null> {
    const resultKey = `job:result:${jobId}`;
    return await redisClient.getJSON(resultKey);
  }

  async clearQueue(): Promise<void> {
    const queueKey = this.getQueueKey();
    await redisClient.del(queueKey);
    logger.info(`Queue ${this.config.name} cleared`);
  }

  async clearFailedQueue(): Promise<void> {
    const queueKey = this.getFailedQueueKey();
    await redisClient.del(queueKey);
    logger.info(`Failed queue ${this.config.name} cleared`);
  }

  getStatus() {
    return {
      name: this.config.name,
      isRunning: this.isRunning,
      activeJobs: this.activeJobs.size,
      concurrency: this.config.concurrency
    };
  }
}

export default BaseWorker;
export { Job, JobResult, WorkerConfig };
