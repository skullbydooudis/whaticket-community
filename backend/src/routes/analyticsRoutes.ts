import express from "express";
import * as AnalyticsController from "../controllers/AnalyticsController";
import isAuth from "../middleware/isAuth";

const analyticsRoutes = express.Router();

analyticsRoutes.get("/analytics/dashboard", isAuth, AnalyticsController.dashboard);

export default analyticsRoutes;
