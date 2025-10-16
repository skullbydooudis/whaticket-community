import { Request, Response } from "express";
import { CircuitBreakerRegistry } from "../utils/CircuitBreaker";
import { getCircuitBreakerStats } from "../config/circuitBreakers";

class CircuitBreakerController {
  async index(req: Request, res: Response): Promise<Response> {
    const stats = getCircuitBreakerStats();

    return res.json({
      circuitBreakers: stats,
      summary: {
        total: Object.keys(stats).length,
        open: Object.values(stats).filter((s) => s.state === "OPEN").length,
        halfOpen: Object.values(stats).filter((s) => s.state === "HALF_OPEN")
          .length,
        closed: Object.values(stats).filter((s) => s.state === "CLOSED").length
      }
    });
  }

  async show(req: Request, res: Response): Promise<Response> {
    const { name } = req.params;
    const breaker = CircuitBreakerRegistry.get(name);

    if (!breaker) {
      return res.status(404).json({
        error: `Circuit breaker '${name}' not found`
      });
    }

    return res.json({
      name,
      stats: breaker.getStats()
    });
  }

  async forceOpen(req: Request, res: Response): Promise<Response> {
    const { name } = req.params;
    const breaker = CircuitBreakerRegistry.get(name);

    if (!breaker) {
      return res.status(404).json({
        error: `Circuit breaker '${name}' not found`
      });
    }

    breaker.forceOpen();

    return res.json({
      message: `Circuit breaker '${name}' forced to OPEN state`,
      stats: breaker.getStats()
    });
  }

  async forceClose(req: Request, res: Response): Promise<Response> {
    const { name } = req.params;
    const breaker = CircuitBreakerRegistry.get(name);

    if (!breaker) {
      return res.status(404).json({
        error: `Circuit breaker '${name}' not found`
      });
    }

    breaker.forceClose();

    return res.json({
      message: `Circuit breaker '${name}' forced to CLOSED state`,
      stats: breaker.getStats()
    });
  }

  async forceClear(req: Request, res: Response): Promise<Response> {
    const { name } = req.params;
    const breaker = CircuitBreakerRegistry.get(name);

    if (!breaker) {
      return res.status(404).json({
        error: `Circuit breaker '${name}' not found`
      });
    }

    breaker.forceClear();

    return res.json({
      message: `Circuit breaker '${name}' stats cleared`,
      stats: breaker.getStats()
    });
  }
}

export default new CircuitBreakerController();
