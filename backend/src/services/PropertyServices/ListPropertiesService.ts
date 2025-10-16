import { Op } from "sequelize";
import Property from "../../models/Property";
import User from "../../models/User";

interface Request {
  searchParam?: string;
  pageNumber?: string;
  status?: string;
  type?: string;
}

interface Response {
  properties: Property[];
  count: number;
  hasMore: boolean;
}

const ListPropertiesService = async ({
  searchParam = "",
  pageNumber = "1",
  status,
  type
}: Request): Promise<Response> => {
  const whereCondition: any = {};
  const limit = 20;
  const offset = limit * (+pageNumber - 1);

  if (searchParam) {
    whereCondition[Op.or] = [
      { title: { [Op.like]: `%${searchParam.toLowerCase().trim()}%` } },
      { description: { [Op.like]: `%${searchParam.toLowerCase().trim()}%` } },
      { address: { [Op.like]: `%${searchParam.toLowerCase().trim()}%` } },
      { city: { [Op.like]: `%${searchParam.toLowerCase().trim()}%` } }
    ];
  }

  if (status) {
    whereCondition.status = status;
  }

  if (type) {
    whereCondition.type = type;
  }

  const { count, rows: properties } = await Property.findAndCountAll({
    where: whereCondition,
    limit,
    offset,
    order: [["createdAt", "DESC"]],
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "name", "email"]
      }
    ]
  });

  const hasMore = count > offset + properties.length;

  return {
    properties,
    count,
    hasMore
  };
};

export default ListPropertiesService;
