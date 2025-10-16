import Store from "../../models/Store";
import User from "../../models/User";
import UserStore from "../../models/UserStore";
import { Op } from "sequelize";

interface Request {
  userId: number;
  searchParam?: string;
  type?: string;
  isActive?: boolean;
  parentStoreId?: number;
  pageNumber?: string;
}

interface Response {
  stores: Store[];
  count: number;
  hasMore: boolean;
}

const ListStoresService = async ({
  userId,
  searchParam,
  type,
  isActive,
  parentStoreId,
  pageNumber = "1"
}: Request): Promise<Response> => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const whereCondition: any = {};

  const userStores = await UserStore.findAll({
    where: { userId },
    attributes: ["storeId"]
  });

  const userStoreIds = userStores.map(us => us.storeId);

  if (user.profile !== "director" && userStoreIds.length > 0) {
    whereCondition.id = { [Op.in]: userStoreIds };
  }

  if (searchParam) {
    whereCondition[Op.or] = [
      { name: { [Op.iLike]: `%${searchParam}%` } },
      { code: { [Op.iLike]: `%${searchParam}%` } },
      { city: { [Op.iLike]: `%${searchParam}%` } }
    ];
  }

  if (type) {
    whereCondition.type = type;
  }

  if (isActive !== undefined) {
    whereCondition.isActive = isActive;
  }

  if (parentStoreId !== undefined) {
    whereCondition.parentStoreId = parentStoreId;
  }

  const limit = 20;
  const offset = limit * (parseInt(pageNumber) - 1);

  const { count, rows: stores } = await Store.findAndCountAll({
    where: whereCondition,
    limit,
    offset,
    include: [
      {
        model: User,
        as: "manager",
        attributes: ["id", "name", "email"]
      },
      {
        model: Store,
        as: "parentStore",
        attributes: ["id", "name", "code"]
      }
    ],
    order: [["createdAt", "DESC"]],
    distinct: true
  });

  const hasMore = count > offset + stores.length;

  return {
    stores,
    count,
    hasMore
  };
};

export default ListStoresService;
