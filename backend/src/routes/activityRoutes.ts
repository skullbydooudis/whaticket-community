import express from "express";
import * as ActivityController from "../controllers/ActivityController";
import isAuth from "../middleware/isAuth";

const activityRoutes = express.Router();

activityRoutes.get("/activities", isAuth, ActivityController.index);
activityRoutes.post("/activities", isAuth, ActivityController.store);

export default activityRoutes;
