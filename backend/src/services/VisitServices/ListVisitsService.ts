import { Op } from "sequelize";
import Visit from "../../models/Visit";
import Property from "../../models/Property";
import Contact from "../../models/Contact";
import User from "../../models/User";

interface Request {
  searchParam?: string;
  pageNumber?: string;
  status?: string;
  propertyId?: string;
  startDate?: Date;
  endDate?: Date;
}

interface Response {
  visits: Visit[];
  count: number;
  hasMore: boolean;
}

const ListVisitsService = async ({
  searchParam = "",
  pageNumber = "1",
  status,
  propertyId,
  startDate,
  endDate
}: Request): Promise<Response> => {
  const whereCondition: any = {};
  const limit = 20;
  const offset = limit * (+pageNumber - 1);

  if (status) {
    whereCondition.status = status;
  }

  if (propertyId) {
    whereCondition.propertyId = propertyId;
  }

  if (startDate || endDate) {
    whereCondition.scheduledDate = {};
    if (startDate) {
      whereCondition.scheduledDate[Op.gte] = startDate;
    }
    if (endDate) {
      whereCondition.scheduledDate[Op.lte] = endDate;
    }
  }

  const { count, rows: visits } = await Visit.findAndCountAll({
    where: whereCondition,
    limit,
    offset,
    order: [["scheduledDate", "DESC"]],
    include: [
      {
        model: Property,
        as: "property",
        attributes: ["id", "title", "address", "city"]
      },
      {
        model: Contact,
        as: "contact",
        attributes: ["id", "name", "number", "email"]
      },
      {
        model: User,
        as: "user",
        attributes: ["id", "name", "email"]
      }
    ]
  });

  const hasMore = count > offset + visits.length;

  return {
    visits,
    count,
    hasMore
  };
};

export default ListVisitsService;
