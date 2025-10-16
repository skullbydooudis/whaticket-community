import AfterSales from "../../models/AfterSales";
import Lead from "../../models/Lead";
import Property from "../../models/Property";
import Store from "../../models/Store";
import User from "../../models/User";
import UserStore from "../../models/UserStore";
import { Op } from "sequelize";

interface Request {
  userId: number;
  storeId?: number;
  status?: string;
  type?: string;
  assignedTo?: number;
  searchParam?: string;
  startDate?: Date;
  endDate?: Date;
  pageNumber?: string;
}

interface Response {
  afterSales: AfterSales[];
  count: number;
  hasMore: boolean;
  stats: {
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
  };
}

const ListAfterSalesService = async (params: Request): Promise<Response> => {
  const {
    userId,
    storeId,
    status,
    type,
    assignedTo,
    searchParam,
    startDate,
    endDate,
    pageNumber = "1"
  } = params;

  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const whereCondition: any = {};

  if (storeId) {
    const userStore = await UserStore.findOne({
      where: { userId, storeId }
    });

    if (!userStore && user.profile !== "director") {
      throw new Error("Access denied to this store");
    }

    whereCondition.storeId = storeId;
  } else if (user.profile !== "director") {
    const userStores = await UserStore.findAll({
      where: { userId },
      attributes: ["storeId"]
    });

    const storeIds = userStores.map(us => us.storeId);
    if (storeIds.length > 0) {
      whereCondition.storeId = { [Op.in]: storeIds };
    } else {
      whereCondition.storeId = -1;
    }
  }

  if (status) {
    whereCondition.status = status;
  }

  if (type) {
    whereCondition.type = type;
  }

  if (assignedTo) {
    whereCondition.assignedTo = assignedTo;
  }

  if (startDate || endDate) {
    whereCondition.createdAt = {};
    if (startDate) {
      whereCondition.createdAt[Op.gte] = startDate;
    }
    if (endDate) {
      whereCondition.createdAt[Op.lte] = endDate;
    }
  }

  if (searchParam) {
    whereCondition[Op.or] = [
      { code: { [Op.iLike]: `%${searchParam}%` } },
      { "$lead.name$": { [Op.iLike]: `%${searchParam}%` } },
      { "$property.title$": { [Op.iLike]: `%${searchParam}%` } }
    ];
  }

  const limit = 20;
  const offset = limit * (parseInt(pageNumber) - 1);

  const { count, rows: afterSales } = await AfterSales.findAndCountAll({
    where: whereCondition,
    limit,
    offset,
    include: [
      {
        model: Lead,
        as: "lead",
        attributes: ["id", "name", "email", "phone"]
      },
      {
        model: Property,
        as: "property",
        attributes: ["id", "title", "address", "city"]
      },
      {
        model: Store,
        as: "store",
        attributes: ["id", "name", "code"]
      },
      {
        model: User,
        as: "assignedUser",
        attributes: ["id", "name", "email"]
      }
    ],
    order: [["createdAt", "DESC"]],
    distinct: true
  });

  const allAfterSales = await AfterSales.findAll({
    where: whereCondition,
    attributes: ["status", "type"]
  });

  const byStatus: Record<string, number> = {};
  const byType: Record<string, number> = {};

  allAfterSales.forEach(as => {
    byStatus[as.status] = (byStatus[as.status] || 0) + 1;
    byType[as.type] = (byType[as.type] || 0) + 1;
  });

  const hasMore = count > offset + afterSales.length;

  return {
    afterSales,
    count,
    hasMore,
    stats: {
      total: count,
      byStatus,
      byType
    }
  };
};

export default ListAfterSalesService;
