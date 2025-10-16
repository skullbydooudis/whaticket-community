import EmailWorker from "./EmailWorker";
import NotificationWorker from "./NotificationWorker";
import logger from "../utils/logger";

class WorkerManager {
  private workers: Map<string, any> = new Map();
  private isInitialized: boolean = false;

  constructor() {
    this.workers.set("email", new EmailWorker());
    this.workers.set("notification", new NotificationWorker());
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn("Workers already initialized");
      return;
    }

    logger.info("Initializing workers...");

    for (const [name, worker] of this.workers) {
      try {
        worker.on("job:completed", (data: any) => {
          logger.debug(`Worker ${name} completed job:`, data.job.id);
        });

        worker.on("job:failed", (data: any) => {
          logger.error(`Worker ${name} failed job:`, {
            jobId: data.job.id,
            error: data.error
          });
        });

        worker.on("job:retry", (data: any) => {
          logger.warn(`Worker ${name} retrying job:`, {
            jobId: data.job.id,
            attempt: data.job.attempts
          });
        });

        await worker.start();
        logger.info(`Worker ${name} started successfully`);
      } catch (error) {
        logger.error(`Failed to start worker ${name}:`, error);
      }
    }

    this.isInitialized = true;
    logger.info("All workers initialized");
  }

  async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    logger.info("Shutting down workers...");

    const shutdownPromises = Array.from(this.workers.entries()).map(
      async ([name, worker]) => {
        try {
          await worker.stop();
          logger.info(`Worker ${name} stopped`);
        } catch (error) {
          logger.error(`Error stopping worker ${name}:`, error);
        }
      }
    );

    await Promise.all(shutdownPromises);

    this.isInitialized = false;
    logger.info("All workers shut down");
  }

  getWorker(name: string): any {
    return this.workers.get(name);
  }

  getStatus() {
    const status: Record<string, any> = {};

    for (const [name, worker] of this.workers) {
      status[name] = worker.getStatus();
    }

    return status;
  }

  async getQueueSizes() {
    const sizes: Record<string, { pending: number; failed: number }> = {};

    for (const [name, worker] of this.workers) {
      try {
        const pending = await worker.getQueueSize();
        const failed = await worker.getFailedQueueSize();

        sizes[name] = { pending, failed };
      } catch (error) {
        logger.error(`Error getting queue sizes for worker ${name}:`, error);
        sizes[name] = { pending: 0, failed: 0 };
      }
    }

    return sizes;
  }
}

const workerManager = new WorkerManager();

export default workerManager;
export { WorkerManager };
