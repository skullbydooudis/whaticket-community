import { Router } from "express";

import userRoutes from "./userRoutes";
import authRoutes from "./authRoutes";
import settingRoutes from "./settingRoutes";
import contactRoutes from "./contactRoutes";
import ticketRoutes from "./ticketRoutes";
import whatsappRoutes from "./whatsappRoutes";
import messageRoutes from "./messageRoutes";
import whatsappSessionRoutes from "./whatsappSessionRoutes";
import queueRoutes from "./queueRoutes";
import quickAnswerRoutes from "./quickAnswerRoutes";
import apiRoutes from "./apiRoutes";
import propertyRoutes from "./propertyRoutes";
import visitRoutes from "./visitRoutes";
import leadRoutes from "./leadRoutes";
import proposalRoutes from "./proposalRoutes";
import taskRoutes from "./taskRoutes";
import pipelineRoutes from "./pipelineRoutes";
import activityRoutes from "./activityRoutes";
import analyticsRoutes from "./analyticsRoutes";
import leadUserRoutes from "./leadUserRoutes";
import whatsappImportRoutes from "./whatsappImportRoutes";

const routes = Router();

routes.use(userRoutes);
routes.use("/auth", authRoutes);
routes.use(settingRoutes);
routes.use(contactRoutes);
routes.use(ticketRoutes);
routes.use(whatsappRoutes);
routes.use(messageRoutes);
routes.use(whatsappSessionRoutes);
routes.use(queueRoutes);
routes.use(quickAnswerRoutes);
routes.use("/api/messages", apiRoutes);
routes.use(propertyRoutes);
routes.use(visitRoutes);
routes.use(leadRoutes);
routes.use(proposalRoutes);
routes.use(taskRoutes);
routes.use(pipelineRoutes);
routes.use(activityRoutes);
routes.use(analyticsRoutes);
routes.use(leadUserRoutes);
routes.use(whatsappImportRoutes);

export default routes;
