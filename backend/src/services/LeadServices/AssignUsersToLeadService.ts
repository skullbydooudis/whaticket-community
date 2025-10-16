import Lead from "../../models/Lead";
import User from "../../models/User";
import LeadUser from "../../models/LeadUser";
import Activity from "../../models/Activity";

interface UserAssignment {
  userId: number;
  role?: string;
  isPrimary?: boolean;
  canEdit?: boolean;
  receiveNotifications?: boolean;
}

interface Request {
  leadId: number;
  users: UserAssignment[];
  requestUserId: number;
}

const AssignUsersToLeadService = async ({ leadId, users, requestUserId }: Request): Promise<Lead> => {
  const lead = await Lead.findByPk(leadId);
  if (!lead) {
    throw new Error("Lead not found");
  }

  const existingAssignments = await LeadUser.findAll({
    where: { leadId }
  });

  const existingUserIds = existingAssignments.map(a => a.userId);

  for (const assignment of users) {
    const user = await User.findByPk(assignment.userId);
    if (!user) {
      console.error(`User ${assignment.userId} not found, skipping`);
      continue;
    }

    if (existingUserIds.includes(assignment.userId)) {
      await LeadUser.update(
        {
          role: assignment.role || "assigned",
          isPrimary: assignment.isPrimary || false,
          canEdit: assignment.canEdit !== undefined ? assignment.canEdit : true,
          receiveNotifications: assignment.receiveNotifications !== undefined ? assignment.receiveNotifications : true
        },
        {
          where: {
            leadId,
            userId: assignment.userId
          }
        }
      );
    } else {
      await LeadUser.create({
        leadId,
        userId: assignment.userId,
        role: assignment.role || "assigned",
        isPrimary: assignment.isPrimary || false,
        canEdit: assignment.canEdit !== undefined ? assignment.canEdit : true,
        receiveNotifications: assignment.receiveNotifications !== undefined ? assignment.receiveNotifications : true
      });

      await Activity.create({
        type: "lead_user_assigned",
        description: `${user.name} foi atribuído ao lead`,
        entityType: "lead",
        entityId: leadId,
        userId: requestUserId,
        metadata: { assignedUserId: assignment.userId }
      });
    }
  }

  const updatedLead = await Lead.findByPk(leadId, {
    include: [
      {
        association: "assignedUsers",
        through: { attributes: ["role", "isPrimary", "canEdit", "receiveNotifications"] }
      }
    ]
  });

  return updatedLead!;
};

export default AssignUsersToLeadService;
