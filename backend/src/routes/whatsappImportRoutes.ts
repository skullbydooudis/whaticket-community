import { Router } from "express";
import isAuth from "../middleware/isAuth";
import checkPermission from "../middleware/checkPermission";
import * as WhatsAppImportController from "../controllers/WhatsAppImportController";

const whatsappImportRoutes = Router();

whatsappImportRoutes.post(
  "/whatsapp/:whatsappId/import-leads",
  isAuth,
  checkPermission("manage:whatsapp", "create:leads"),
  WhatsAppImportController.importLeads
);

whatsappImportRoutes.get(
  "/whatsapp/:whatsappId/import-status",
  isAuth,
  checkPermission("view:leads"),
  WhatsAppImportController.getImportStatus
);

export default whatsappImportRoutes;
