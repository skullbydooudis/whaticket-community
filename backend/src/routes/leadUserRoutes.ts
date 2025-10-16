import { Router } from "express";
import isAuth from "../middleware/isAuth";
import checkPermission from "../middleware/checkPermission";
import * as LeadUserController from "../controllers/LeadUserController";

const leadUserRoutes = Router();

leadUserRoutes.get(
  "/leads/my-leads",
  isAuth,
  checkPermission("view:leads"),
  LeadUserController.listMyLeads
);

leadUserRoutes.post(
  "/leads/:leadId/assign-users",
  isAuth,
  checkPermission("edit:leads"),
  LeadUserController.assignUsers
);

leadUserRoutes.get(
  "/leads/:leadId/assigned-users",
  isAuth,
  checkPermission("view:leads"),
  LeadUserController.listAssignedUsers
);

leadUserRoutes.delete(
  "/leads/:leadId/assigned-users/:userId",
  isAuth,
  checkPermission("edit:leads"),
  LeadUserController.removeUserAssignment
);

export default leadUserRoutes;
