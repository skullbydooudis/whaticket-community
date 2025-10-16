import { Op } from "sequelize";
import Lead from "../../models/Lead";
import User from "../../models/User";
import Contact from "../../models/Contact";

interface Request {
  searchParam?: string;
  pageNumber?: string;
  status?: string;
  source?: string;
  assignedTo?: number;
  stageId?: string;
}

interface Response {
  leads: Lead[];
  count: number;
  hasMore: boolean;
}

const ListLeadsService = async ({
  searchParam = "",
  pageNumber = "1",
  status,
  source,
  assignedTo,
  stageId
}: Request): Promise<Response> => {
  const whereCondition: any = {};
  const limit = 20;
  const offset = limit * (+pageNumber - 1);

  if (searchParam) {
    whereCondition[Op.or] = [
      { name: { [Op.like]: `%${searchParam.toLowerCase().trim()}%` } },
      { email: { [Op.like]: `%${searchParam.toLowerCase().trim()}%` } },
      { phone: { [Op.like]: `%${searchParam.toLowerCase().trim()}%` } }
    ];
  }

  if (status) {
    whereCondition.status = status;
  }

  if (source) {
    whereCondition.source = source;
  }

  if (assignedTo) {
    whereCondition.assignedTo = assignedTo;
  }

  if (stageId) {
    whereCondition.stageId = stageId;
  }

  const { count, rows: leads } = await Lead.findAndCountAll({
    where: whereCondition,
    limit,
    offset,
    order: [["createdAt", "DESC"]],
    include: [
      {
        model: User,
        as: "assignedUser",
        attributes: ["id", "name", "email"]
      },
      {
        model: Contact,
        as: "contact",
        attributes: ["id", "name", "number", "email"]
      }
    ]
  });

  const hasMore = count > offset + leads.length;

  return {
    leads,
    count,
    hasMore
  };
};

export default ListLeadsService;
