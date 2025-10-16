import { Request, Response } from "express";
import AssignUsersToLeadService from "../services/LeadServices/AssignUsersToLeadService";
import LeadUser from "../models/LeadUser";
import Lead from "../models/Lead";
import User from "../models/User";

export const assignUsers = async (req: Request, res: Response): Promise<Response> => {
  const { leadId } = req.params;
  const { users } = req.body;

  const lead = await AssignUsersToLeadService({
    leadId: parseInt(leadId),
    users,
    requestUserId: parseInt(req.user.id)
  });

  return res.status(200).json(lead);
};

export const listAssignedUsers = async (req: Request, res: Response): Promise<Response> => {
  const { leadId } = req.params;

  const assignments = await LeadUser.findAll({
    where: { leadId: parseInt(leadId) },
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "name", "email", "profile"]
      }
    ]
  });

  return res.status(200).json(assignments);
};

export const removeUserAssignment = async (req: Request, res: Response): Promise<Response> => {
  const { leadId, userId } = req.params;

  await LeadUser.destroy({
    where: {
      leadId: parseInt(leadId),
      userId: parseInt(userId)
    }
  });

  return res.status(200).json({ message: "User assignment removed" });
};

export const listMyLeads = async (req: Request, res: Response): Promise<Response> => {
  const userId = parseInt(req.user.id);
  const { status, pageNumber = "1" } = req.query;

  const limit = 20;
  const offset = limit * (parseInt(pageNumber as string) - 1);

  const whereClause: any = {};
  if (status) {
    whereClause.status = status;
  }

  const { count, rows: leadUsers } = await LeadUser.findAndCountAll({
    where: { userId },
    include: [
      {
        model: Lead,
        as: "lead",
        where: whereClause,
        include: ["contact", "assignedUsers"]
      }
    ],
    limit,
    offset,
    order: [[{ model: Lead, as: "lead" }, "createdAt", "DESC"]]
  });

  const leads = leadUsers.map(lu => ({
    ...lu.lead.toJSON(),
    assignment: {
      role: lu.role,
      isPrimary: lu.isPrimary,
      canEdit: lu.canEdit,
      receiveNotifications: lu.receiveNotifications
    }
  }));

  return res.status(200).json({
    leads,
    count,
    hasMore: count > offset + leads.length
  });
};
