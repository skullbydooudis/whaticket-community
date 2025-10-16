import { Op } from "sequelize";
import Property from "../../models/Property";
import User from "../../models/User";
import cacheService from "../CacheService";
import logger from "../../utils/logger";

interface Request {
  searchParam?: string;
  pageNumber?: string;
  status?: string;
  type?: string;
  city?: string;
  priceMin?: number;
  priceMax?: number;
  bedrooms?: number;
  bathrooms?: number;
  areaMin?: number;
  areaMax?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

interface Response {
  properties: Property[];
  count: number;
  hasMore: boolean;
  page: number;
  totalPages: number;
}

const ListPropertiesService = async ({
  searchParam = "",
  pageNumber = "1",
  status,
  type,
  city,
  priceMin,
  priceMax,
  bedrooms,
  bathrooms,
  areaMin,
  areaMax,
  sortBy = "createdAt",
  sortOrder = "DESC"
}: Request): Promise<Response> => {
  try {
    const cacheKey = cacheService.generateCacheKey([
      "properties",
      "list",
      pageNumber,
      searchParam,
      status,
      type,
      city,
      priceMin,
      priceMax,
      bedrooms,
      bathrooms,
      areaMin,
      areaMax,
      sortBy,
      sortOrder
    ]);

    const cached = await cacheService.get<Response>(cacheKey);
    if (cached) {
      logger.debug("Properties list served from cache");
      return cached;
    }

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

    if (city) {
      whereCondition.city = city;
    }

    if (priceMin !== undefined || priceMax !== undefined) {
      whereCondition.price = {};
      if (priceMin !== undefined) {
        whereCondition.price[Op.gte] = priceMin;
      }
      if (priceMax !== undefined) {
        whereCondition.price[Op.lte] = priceMax;
      }
    }

    if (bedrooms !== undefined) {
      whereCondition.bedrooms = bedrooms;
    }

    if (bathrooms !== undefined) {
      whereCondition.bathrooms = bathrooms;
    }

    if (areaMin !== undefined || areaMax !== undefined) {
      whereCondition.area = {};
      if (areaMin !== undefined) {
        whereCondition.area[Op.gte] = areaMin;
      }
      if (areaMax !== undefined) {
        whereCondition.area[Op.lte] = areaMax;
      }
    }

    const validSortFields = [
      "createdAt",
      "price",
      "area",
      "title",
      "bedrooms",
      "bathrooms"
    ];
    const orderField = validSortFields.includes(sortBy) ? sortBy : "createdAt";
    const orderDirection = sortOrder === "ASC" ? "ASC" : "DESC";

    const { count, rows: properties } = await Property.findAndCountAll({
      where: whereCondition,
      limit,
      offset,
      order: [[orderField, orderDirection]],
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email"]
        }
      ]
    });

    const hasMore = count > offset + properties.length;
    const totalPages = Math.ceil(count / limit);

    const response = {
      properties,
      count,
      hasMore,
      page: +pageNumber,
      totalPages
    };

    await cacheService.set(cacheKey, response, {
      ttl: 300,
      tags: ["properties", "properties:list"]
    });

    logger.info(`Listed ${properties.length} properties (page ${pageNumber})`);

    return response;
  } catch (error) {
    logger.error("Error listing properties:", error);
    throw error;
  }
};

export default ListPropertiesService;
