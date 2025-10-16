import Activity from "../../models/Activity";
import User from "../../models/User";

interface Request {
  entityType?: string;
  entityId?: number;
  userId?: number;
  type?: string;
  limit?: number;
}

interface Response {
  activities: Activity[];
  count: number;
}

const ListActivitiesService = async ({
  entityType,
  entityId,
  userId,
  type,
  limit = 50
}: Request): Promise<Response> => {
  const where: any = {};

  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = entityId;
  if (userId) where.userId = userId;
  if (type) where.type = type;

  const { count, rows: activities } = await Activity.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "name", "email"]
      }
    ],
    order: [["createdAt", "DESC"]],
    limit
  });

  return { activities, count };
};

export default ListActivitiesService;
