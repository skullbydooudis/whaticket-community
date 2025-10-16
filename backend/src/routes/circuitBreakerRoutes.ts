import { Router } from "express";
import CircuitBreakerController from "../controllers/CircuitBreakerController";
import isAuth from "../middleware/isAuth";
import checkPermission from "../middleware/checkPermission";

const circuitBreakerRoutes = Router();

circuitBreakerRoutes.get(
  "/circuit-breakers",
  isAuth,
  checkPermission("admin"),
  CircuitBreakerController.index
);

circuitBreakerRoutes.get(
  "/circuit-breakers/:name",
  isAuth,
  checkPermission("admin"),
  CircuitBreakerController.show
);

circuitBreakerRoutes.post(
  "/circuit-breakers/:name/open",
  isAuth,
  checkPermission("admin"),
  CircuitBreakerController.forceOpen
);

circuitBreakerRoutes.post(
  "/circuit-breakers/:name/close",
  isAuth,
  checkPermission("admin"),
  CircuitBreakerController.forceClose
);

circuitBreakerRoutes.post(
  "/circuit-breakers/:name/clear",
  isAuth,
  checkPermission("admin"),
  CircuitBreakerController.forceClear
);

export default circuitBreakerRoutes;
