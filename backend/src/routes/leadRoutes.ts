import { Router } from "express";
import isAuth from "../middleware/isAuth";
import checkPermission from "../middleware/checkPermission";
import * as LeadController from "../controllers/LeadController";

const leadRoutes = Router();

leadRoutes.get("/leads", isAuth, checkPermission("view:leads"), LeadController.index);
leadRoutes.post("/leads", isAuth, checkPermission("create:leads"), LeadController.store);
leadRoutes.get("/leads/:leadId", isAuth, checkPermission("view:leads"), LeadController.show);
leadRoutes.put("/leads/:leadId", isAuth, checkPermission("edit:leads"), LeadController.update);
leadRoutes.delete("/leads/:leadId", isAuth, checkPermission("delete:leads"), LeadController.remove);
leadRoutes.put("/leads/:leadId/stage", isAuth, checkPermission("edit:leads"), LeadController.updateStage);
leadRoutes.post("/leads/:leadId/qualify", isAuth, checkPermission("view:leads"), LeadController.qualify);
leadRoutes.get("/leads/:leadId/match-properties", isAuth, checkPermission("view:leads"), LeadController.matchProperties);

export default leadRoutes;
