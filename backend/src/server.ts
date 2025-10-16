import gracefulShutdown from "http-graceful-shutdown";
import app from "./app";
import { initIO } from "./libs/socket";
import { logger } from "./utils/logger";
import { StartAllWhatsAppsSessions } from "./services/WbotServices/StartAllWhatsAppsSessions";
import redisClient from "./config/redis";
import workerManager from "./workers";
import { shutdownHandler } from "./middleware/errorHandler";

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  try {
    logger.info("🚀 Starting application...");

    logger.info("📊 Checking Redis connection...");
    const redisConnected = await redisClient.ping();
    if (redisConnected) {
      logger.info("✅ Redis connected successfully");
    } else {
      logger.warn("⚠️  Redis connection failed - caching disabled");
    }

    logger.info("🔧 Initializing workers...");
    await workerManager.initialize();
    logger.info("✅ Workers initialized successfully");

    const server = app.listen(PORT, () => {
      logger.info(`✅ Server started on port: ${PORT}`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
      logger.info(`🔗 API URL: http://localhost:${PORT}`);
      logger.info(`💚 Health Check: http://localhost:${PORT}/health`);
    });

    logger.info("🔌 Initializing Socket.IO...");
    initIO(server);
    logger.info("✅ Socket.IO initialized");

    logger.info("📱 Starting WhatsApp sessions...");
    StartAllWhatsAppsSessions().catch(error => {
      logger.error("❌ Error starting WhatsApp sessions:", error);
    });

    const shutdown = async () => {
      logger.info("🛑 Shutting down gracefully...");

      logger.info("Stopping workers...");
      await workerManager.shutdown();

      logger.info("Disconnecting Redis...");
      await redisClient.disconnect();

      logger.info("Closing server...");
      await shutdownHandler("SIGTERM");

      process.exit(0);
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);

    gracefulShutdown(server, {
      signals: "SIGINT SIGTERM",
      timeout: 30000,
      development: process.env.NODE_ENV !== "production",
      onShutdown: async (signal) => {
        logger.info(`Received ${signal}, initiating graceful shutdown...`);
        await workerManager.shutdown();
        await redisClient.disconnect();
      },
      finally: () => {
        logger.info("✅ Server shut down gracefully");
      }
    });

    logger.info("✨ Application started successfully!");
  } catch (error) {
    logger.error("❌ Fatal error during startup:", error);
    process.exit(1);
  }
}

bootstrap();
