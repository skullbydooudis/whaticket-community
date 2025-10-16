import EventEmitter from "events";
import { logger } from "./logger";

export enum CircuitState {
  CLOSED = "CLOSED",
  OPEN = "OPEN",
  HALF_OPEN = "HALF_OPEN"
}

export interface CircuitBreakerOptions {
  failureThreshold: number;
  successThreshold: number;
  timeout: number;
  resetTimeout: number;
  name?: string;
  fallback?: () => any;
  onStateChange?: (state: CircuitState) => void;
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  totalCalls: number;
  lastFailureTime?: number;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
}

export class CircuitBreaker extends EventEmitter {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private totalCalls: number = 0;
  private lastFailureTime?: number;
  private consecutiveFailures: number = 0;
  private consecutiveSuccesses: number = 0;
  private nextAttempt: number = Date.now();
  private resetTimer?: NodeJS.Timeout;

  constructor(private options: CircuitBreakerOptions) {
    super();
    if (!options.name) {
      options.name = `circuit-${Date.now()}`;
    }
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    this.totalCalls++;

    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        const error = new Error(
          `Circuit breaker [${this.options.name}] is OPEN. Failing fast.`
        );
        logger.warn(`Circuit breaker [${this.options.name}] rejected call`, {
          state: this.state,
          nextAttempt: this.nextAttempt,
          failureCount: this.failureCount
        });

        if (this.options.fallback) {
          logger.debug(`Circuit breaker [${this.options.name}] executing fallback`);
          return this.options.fallback();
        }

        throw error;
      }

      this.transitionTo(CircuitState.HALF_OPEN);
    }

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Operation timeout after ${this.options.timeout}ms`));
        }, this.options.timeout);
      });

      const result = await Promise.race([fn(), timeoutPromise]);

      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();

      if (this.options.fallback && this.state === CircuitState.OPEN) {
        logger.info(
          `Circuit breaker [${this.options.name}] opened, executing fallback`
        );
        return this.options.fallback();
      }

      throw error;
    }
  }

  private onSuccess(): void {
    this.successCount++;
    this.consecutiveSuccesses++;
    this.consecutiveFailures = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      if (this.consecutiveSuccesses >= this.options.successThreshold) {
        logger.info(
          `Circuit breaker [${this.options.name}] recovered after ${this.consecutiveSuccesses} successes`
        );
        this.transitionTo(CircuitState.CLOSED);
        this.reset();
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.consecutiveFailures++;
    this.consecutiveSuccesses = 0;
    this.lastFailureTime = Date.now();

    logger.warn(`Circuit breaker [${this.options.name}] registered failure`, {
      consecutiveFailures: this.consecutiveFailures,
      threshold: this.options.failureThreshold,
      state: this.state
    });

    if (
      this.state === CircuitState.HALF_OPEN ||
      this.consecutiveFailures >= this.options.failureThreshold
    ) {
      this.trip();
    }
  }

  private trip(): void {
    this.transitionTo(CircuitState.OPEN);
    this.nextAttempt = Date.now() + this.options.resetTimeout;

    logger.error(`Circuit breaker [${this.options.name}] OPENED`, {
      failureCount: this.failureCount,
      consecutiveFailures: this.consecutiveFailures,
      resetTimeout: this.options.resetTimeout,
      nextAttempt: new Date(this.nextAttempt).toISOString()
    });

    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
    }

    this.resetTimer = setTimeout(() => {
      if (this.state === CircuitState.OPEN) {
        logger.info(
          `Circuit breaker [${this.options.name}] attempting recovery to HALF_OPEN`
        );
        this.transitionTo(CircuitState.HALF_OPEN);
      }
    }, this.options.resetTimeout);
  }

  private transitionTo(newState: CircuitState): void {
    const previousState = this.state;
    this.state = newState;

    if (previousState !== newState) {
      this.emit("stateChange", { from: previousState, to: newState });

      if (this.options.onStateChange) {
        this.options.onStateChange(newState);
      }

      logger.info(`Circuit breaker [${this.options.name}] state changed`, {
        from: previousState,
        to: newState
      });
    }
  }

  private reset(): void {
    this.consecutiveFailures = 0;
    this.consecutiveSuccesses = 0;

    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
      this.resetTimer = undefined;
    }
  }

  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failureCount,
      successes: this.successCount,
      totalCalls: this.totalCalls,
      lastFailureTime: this.lastFailureTime,
      consecutiveFailures: this.consecutiveFailures,
      consecutiveSuccesses: this.consecutiveSuccesses
    };
  }

  getState(): CircuitState {
    return this.state;
  }

  isOpen(): boolean {
    return this.state === CircuitState.OPEN;
  }

  isClosed(): boolean {
    return this.state === CircuitState.CLOSED;
  }

  isHalfOpen(): boolean {
    return this.state === CircuitState.HALF_OPEN;
  }

  forceOpen(): void {
    this.transitionTo(CircuitState.OPEN);
    this.nextAttempt = Date.now() + this.options.resetTimeout;
  }

  forceClose(): void {
    this.transitionTo(CircuitState.CLOSED);
    this.reset();
  }

  forceClear(): void {
    this.reset();
    this.failureCount = 0;
    this.successCount = 0;
    this.totalCalls = 0;
    this.lastFailureTime = undefined;
  }
}

export class CircuitBreakerRegistry {
  private static breakers: Map<string, CircuitBreaker> = new Map();

  static register(name: string, breaker: CircuitBreaker): void {
    this.breakers.set(name, breaker);
  }

  static get(name: string): CircuitBreaker | undefined {
    return this.breakers.get(name);
  }

  static getAll(): Map<string, CircuitBreaker> {
    return this.breakers;
  }

  static getStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};
    this.breakers.forEach((breaker, name) => {
      stats[name] = breaker.getStats();
    });
    return stats;
  }

  static clear(): void {
    this.breakers.clear();
  }
}
