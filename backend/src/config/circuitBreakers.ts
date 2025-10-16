import { CircuitBreaker, CircuitBreakerRegistry } from "../utils/CircuitBreaker";
import { logger } from "../utils/logger";

export const databaseCircuitBreaker = new CircuitBreaker({
  name: "database",
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 10000,
  resetTimeout: 30000,
  onStateChange: (state) => {
    logger.warn(`Database circuit breaker state changed to ${state}`);
  },
  fallback: () => {
    throw new Error("Database is temporarily unavailable. Please try again later.");
  }
});

export const redisCircuitBreaker = new CircuitBreaker({
  name: "redis",
  failureThreshold: 3,
  successThreshold: 2,
  timeout: 5000,
  resetTimeout: 20000,
  onStateChange: (state) => {
    logger.warn(`Redis circuit breaker state changed to ${state}`);
  },
  fallback: () => {
    logger.info("Redis fallback: operation skipped gracefully");
    return null;
  }
});

export const whatsappApiCircuitBreaker = new CircuitBreaker({
  name: "whatsapp-api",
  failureThreshold: 5,
  successThreshold: 3,
  timeout: 15000,
  resetTimeout: 60000,
  onStateChange: (state) => {
    logger.warn(`WhatsApp API circuit breaker state changed to ${state}`);
  },
  fallback: () => {
    logger.warn("WhatsApp API unavailable, message queued for retry");
    return { queued: true, success: false };
  }
});

export const emailCircuitBreaker = new CircuitBreaker({
  name: "email",
  failureThreshold: 5,
  successThreshold: 3,
  timeout: 10000,
  resetTimeout: 30000,
  onStateChange: (state) => {
    logger.warn(`Email circuit breaker state changed to ${state}`);
  },
  fallback: () => {
    logger.warn("Email service unavailable, email queued for retry");
    return { queued: true, success: false };
  }
});

export const externalApiCircuitBreaker = new CircuitBreaker({
  name: "external-api",
  failureThreshold: 10,
  successThreshold: 3,
  timeout: 20000,
  resetTimeout: 60000,
  onStateChange: (state) => {
    logger.warn(`External API circuit breaker state changed to ${state}`);
  },
  fallback: () => {
    throw new Error("External service is temporarily unavailable. Please try again later.");
  }
});

CircuitBreakerRegistry.register("database", databaseCircuitBreaker);
CircuitBreakerRegistry.register("redis", redisCircuitBreaker);
CircuitBreakerRegistry.register("whatsapp-api", whatsappApiCircuitBreaker);
CircuitBreakerRegistry.register("email", emailCircuitBreaker);
CircuitBreakerRegistry.register("external-api", externalApiCircuitBreaker);

export function getCircuitBreakerStats() {
  return CircuitBreakerRegistry.getStats();
}
