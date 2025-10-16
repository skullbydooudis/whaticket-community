import Property from "../../models/Property";
import { Op } from "sequelize";

interface SearchFilters {
  query?: string;
  type?: string[];
  status?: string[];
  city?: string[];
  priceMin?: number;
  priceMax?: number;
  areaMin?: number;
  areaMax?: number;
  bedrooms?: number[];
  bathrooms?: number[];
  parkingSpaces?: number[];
  features?: string[];
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
  limit?: number;
  offset?: number;
}

interface SearchResult {
  properties: Property[];
  total: number;
  filters: {
    availableTypes: string[];
    availableCities: string[];
    priceRange: { min: number; max: number };
    areaRange: { min: number; max: number };
  };
}

const AdvancedSearchService = async (filters: SearchFilters): Promise<SearchResult> => {
  const whereConditions: any = { isActive: true };

  if (filters.query) {
    whereConditions[Op.or] = [
      { title: { [Op.iLike]: `%${filters.query}%` } },
      { description: { [Op.iLike]: `%${filters.query}%` } },
      { address: { [Op.iLike]: `%${filters.query}%` } }
    ];
  }

  if (filters.type && filters.type.length > 0) {
    whereConditions.type = { [Op.in]: filters.type };
  }

  if (filters.status && filters.status.length > 0) {
    whereConditions.status = { [Op.in]: filters.status };
  }

  if (filters.city && filters.city.length > 0) {
    whereConditions.city = { [Op.in]: filters.city };
  }

  if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
    whereConditions.price = {};
    if (filters.priceMin !== undefined) {
      whereConditions.price[Op.gte] = filters.priceMin;
    }
    if (filters.priceMax !== undefined) {
      whereConditions.price[Op.lte] = filters.priceMax;
    }
  }

  if (filters.areaMin !== undefined || filters.areaMax !== undefined) {
    whereConditions.area = {};
    if (filters.areaMin !== undefined) {
      whereConditions.area[Op.gte] = filters.areaMin;
    }
    if (filters.areaMax !== undefined) {
      whereConditions.area[Op.lte] = filters.areaMax;
    }
  }

  if (filters.bedrooms && filters.bedrooms.length > 0) {
    whereConditions.bedrooms = { [Op.in]: filters.bedrooms };
  }

  if (filters.bathrooms && filters.bathrooms.length > 0) {
    whereConditions.bathrooms = { [Op.in]: filters.bathrooms };
  }

  if (filters.parkingSpaces && filters.parkingSpaces.length > 0) {
    whereConditions.parkingSpaces = { [Op.in]: filters.parkingSpaces };
  }

  const orderBy: any[] = [];
  if (filters.sortBy) {
    orderBy.push([filters.sortBy, filters.sortOrder || "ASC"]);
  } else {
    orderBy.push(["createdAt", "DESC"]);
  }

  const { count, rows: properties } = await Property.findAndCountAll({
    where: whereConditions,
    order: orderBy,
    limit: filters.limit || 20,
    offset: filters.offset || 0
  });

  const allProperties = await Property.findAll({
    where: { isActive: true },
    attributes: ["type", "city", "price", "area"]
  });

  const availableTypes = [...new Set(allProperties.map(p => p.type).filter(Boolean))];
  const availableCities = [...new Set(allProperties.map(p => p.city).filter(Boolean))];

  const prices = allProperties.map(p => p.price).filter(Boolean) as number[];
  const areas = allProperties.map(p => p.area).filter(Boolean) as number[];

  const priceRange = {
    min: prices.length > 0 ? Math.min(...prices) : 0,
    max: prices.length > 0 ? Math.max(...prices) : 0
  };

  const areaRange = {
    min: areas.length > 0 ? Math.min(...areas) : 0,
    max: areas.length > 0 ? Math.max(...areas) : 0
  };

  return {
    properties,
    total: count,
    filters: {
      availableTypes,
      availableCities,
      priceRange,
      areaRange
    }
  };
};

export default AdvancedSearchService;
