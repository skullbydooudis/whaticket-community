import { Router } from "express";
import isAuth from "../middleware/isAuth";
import * as ProposalController from "../controllers/ProposalController";

const proposalRoutes = Router();

proposalRoutes.get("/proposals", isAuth, ProposalController.index);
proposalRoutes.post("/proposals", isAuth, ProposalController.store);
proposalRoutes.get("/proposals/:proposalId", isAuth, ProposalController.show);
proposalRoutes.put("/proposals/:proposalId", isAuth, ProposalController.update);
proposalRoutes.put("/proposals/:proposalId/status", isAuth, ProposalController.updateStatus);
proposalRoutes.delete("/proposals/:proposalId", isAuth, ProposalController.remove);

export default proposalRoutes;
