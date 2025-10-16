import { Router } from "express";
import isAuth from "../middleware/isAuth";
import * as VisitController from "../controllers/VisitController";

const visitRoutes = Router();

visitRoutes.get("/visits", isAuth, VisitController.index);
visitRoutes.post("/visits", isAuth, VisitController.store);
visitRoutes.put("/visits/:visitId", isAuth, VisitController.update);
visitRoutes.delete("/visits/:visitId", isAuth, VisitController.remove);

export default visitRoutes;
