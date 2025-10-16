import { Request, Response, NextFunction } from "express";
import User from "../models/User";

export type Permission =
  | "view:leads"
  | "create:leads"
  | "edit:leads"
  | "delete:leads"
  | "view:properties"
  | "create:properties"
  | "edit:properties"
  | "delete:properties"
  | "view:proposals"
  | "create:proposals"
  | "edit:proposals"
  | "delete:proposals"
  | "view:visits"
  | "create:visits"
  | "edit:visits"
  | "delete:visits"
  | "view:analytics"
  | "view:all-analytics"
  | "manage:users"
  | "manage:whatsapp"
  | "manage:settings";

const rolePermissions: Record<string, Permission[]> = {
  director: [
    "view:leads", "create:leads", "edit:leads", "delete:leads",
    "view:properties", "create:properties", "edit:properties", "delete:properties",
    "view:proposals", "create:proposals", "edit:proposals", "delete:proposals",
    "view:visits", "create:visits", "edit:visits", "delete:visits",
    "view:analytics", "view:all-analytics",
    "manage:users", "manage:whatsapp", "manage:settings"
  ],
  manager: [
    "view:leads", "create:leads", "edit:leads", "delete:leads",
    "view:properties", "create:properties", "edit:properties", "delete:properties",
    "view:proposals", "create:proposals", "edit:proposals", "delete:proposals",
    "view:visits", "create:visits", "edit:visits", "delete:visits",
    "view:analytics", "view:all-analytics",
    "manage:users"
  ],
  broker: [
    "view:leads", "create:leads", "edit:leads",
    "view:properties", "create:properties", "edit:properties",
    "view:proposals", "create:proposals", "edit:proposals",
    "view:visits", "create:visits", "edit:visits",
    "view:analytics"
  ],
  user: [
    "view:leads", "create:leads",
    "view:properties",
    "view:proposals",
    "view:visits", "create:visits",
    "view:analytics"
  ]
};

export const hasPermission = (user: User, permission: Permission): boolean => {
  const userRole = user.profile || "user";
  const permissions = rolePermissions[userRole] || [];
  return permissions.includes(permission);
};

export const checkPermission = (...permissions: Permission[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      const hasRequiredPermission = permissions.some(permission =>
        hasPermission(user, permission)
      );

      if (!hasRequiredPermission) {
        return res.status(403).json({
          error: "Insufficient permissions",
          required: permissions,
          userRole: user.profile
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({ error: "Permission check failed" });
    }
  };
};

export default checkPermission;
