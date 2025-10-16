import { Router } from "express";
import isAuth from "../middleware/isAuth";
import checkPermission from "../middleware/checkPermission";
import * as AfterSalesController from "../controllers/AfterSalesController";

const afterSalesRoutes = Router();

afterSalesRoutes.get(
  "/after-sales",
  isAuth,
  checkPermission("view:proposals"),
  AfterSalesController.index
);

afterSalesRoutes.post(
  "/after-sales",
  isAuth,
  checkPermission("create:proposals"),
  AfterSalesController.store
);

afterSalesRoutes.get(
  "/after-sales/dashboard",
  isAuth,
  checkPermission("view:analytics"),
  AfterSalesController.dashboard
);

afterSalesRoutes.get(
  "/after-sales/:afterSalesId",
  isAuth,
  checkPermission("view:proposals"),
  AfterSalesController.show
);

afterSalesRoutes.put(
  "/after-sales/:afterSalesId",
  isAuth,
  checkPermission("edit:proposals"),
  AfterSalesController.update
);

afterSalesRoutes.put(
  "/after-sales/:afterSalesId/status",
  isAuth,
  checkPermission("edit:proposals"),
  AfterSalesController.updateStatus
);

afterSalesRoutes.get(
  "/after-sales/:afterSalesId/documents",
  isAuth,
  checkPermission("view:proposals"),
  AfterSalesController.listDocuments
);

afterSalesRoutes.post(
  "/after-sales/:afterSalesId/documents",
  isAuth,
  checkPermission("create:proposals"),
  AfterSalesController.uploadDocument
);

afterSalesRoutes.post(
  "/after-sales/:afterSalesId/timeline",
  isAuth,
  checkPermission("edit:proposals"),
  AfterSalesController.addTimelineEvent
);

afterSalesRoutes.post(
  "/after-sales/:afterSalesId/checklist",
  isAuth,
  checkPermission("edit:proposals"),
  AfterSalesController.addChecklistItem
);

afterSalesRoutes.put(
  "/after-sales/documents/:documentId/approve",
  isAuth,
  checkPermission("edit:proposals"),
  AfterSalesController.approveDocument
);

afterSalesRoutes.put(
  "/after-sales/documents/:documentId/reject",
  isAuth,
  checkPermission("edit:proposals"),
  AfterSalesController.rejectDocument
);

afterSalesRoutes.put(
  "/after-sales/checklist/:itemId/complete",
  isAuth,
  checkPermission("edit:proposals"),
  AfterSalesController.completeChecklistItem
);

export default afterSalesRoutes;
