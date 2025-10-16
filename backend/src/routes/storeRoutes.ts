import { Router } from "express";
import isAuth from "../middleware/isAuth";
import checkPermission from "../middleware/checkPermission";
import * as StoreController from "../controllers/StoreController";

const storeRoutes = Router();

storeRoutes.get(
  "/stores",
  isAuth,
  StoreController.index
);

storeRoutes.post(
  "/stores",
  isAuth,
  checkPermission("manage:settings"),
  StoreController.store
);

storeRoutes.get(
  "/stores/:storeId",
  isAuth,
  StoreController.show
);

storeRoutes.put(
  "/stores/:storeId",
  isAuth,
  checkPermission("manage:settings"),
  StoreController.update
);

storeRoutes.delete(
  "/stores/:storeId",
  isAuth,
  checkPermission("manage:settings"),
  StoreController.remove
);

storeRoutes.get(
  "/stores/:storeId/users",
  isAuth,
  StoreController.listUsers
);

storeRoutes.post(
  "/stores/:storeId/users",
  isAuth,
  checkPermission("manage:users"),
  StoreController.assignUser
);

storeRoutes.delete(
  "/stores/:storeId/users/:userId",
  isAuth,
  checkPermission("manage:users"),
  StoreController.removeUser
);

export default storeRoutes;
