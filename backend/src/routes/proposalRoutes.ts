import { Router } from "express";
import isAuth from "../middleware/isAuth";
import * as ProposalController from "../controllers/ProposalController";

const proposalRoutes = Router();

proposalRoutes.get("/proposals", isAuth, ProposalController.index);
proposalRoutes.post("/proposals", isAuth, ProposalController.store);
proposalRoutes.post("/proposals/generate", isAuth, ProposalController.generate);
proposalRoutes.get("/proposals/:proposalId", isAuth, ProposalController.show);
proposalRoutes.put("/proposals/:proposalId", isAuth, ProposalController.update);
proposalRoutes.put("/proposals/:proposalId/status", isAuth, ProposalController.updateStatus);
proposalRoutes.post("/proposals/:proposalId/send", isAuth, ProposalController.send);
proposalRoutes.post("/proposals/:proposalId/change-status", isAuth, ProposalController.changeStatus);
proposalRoutes.delete("/proposals/:proposalId", isAuth, ProposalController.remove);

export default proposalRoutes;
