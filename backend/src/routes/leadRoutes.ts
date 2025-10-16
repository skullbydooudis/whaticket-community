import { Router } from "express";
import isAuth from "../middleware/isAuth";
import * as LeadController from "../controllers/LeadController";

const leadRoutes = Router();

leadRoutes.get("/leads", isAuth, LeadController.index);
leadRoutes.post("/leads", isAuth, LeadController.store);
leadRoutes.get("/leads/:leadId", isAuth, LeadController.show);
leadRoutes.put("/leads/:leadId", isAuth, LeadController.update);
leadRoutes.delete("/leads/:leadId", isAuth, LeadController.remove);
leadRoutes.put("/leads/:leadId/stage", isAuth, LeadController.updateStage);

export default leadRoutes;
