import { Request, Response } from "express";
import CreatePropertyService from "../services/PropertyServices/CreatePropertyService";
import ListPropertiesService from "../services/PropertyServices/ListPropertiesService";
import ShowPropertyService from "../services/PropertyServices/ShowPropertyService";
import UpdatePropertyService from "../services/PropertyServices/UpdatePropertyService";
import DeletePropertyService from "../services/PropertyServices/DeletePropertyService";
import GetPropertyByPublicUrlService from "../services/PropertyServices/GetPropertyByPublicUrlService";
import GetPropertyAnalyticsService from "../services/PropertyServices/GetPropertyAnalyticsService";
import AdvancedSearchService from "../services/PropertyServices/AdvancedSearchService";

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber, status, type } = req.query as {
    searchParam?: string;
    pageNumber?: string;
    status?: string;
    type?: string;
  };

  const { properties, count, hasMore } = await ListPropertiesService({
    searchParam,
    pageNumber,
    status,
    type
  });

  return res.json({ properties, count, hasMore });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const {
    title,
    description,
    type,
    status,
    price,
    area,
    bedrooms,
    bathrooms,
    parkingSpaces,
    address,
    city,
    state,
    zipCode,
    images,
    features,
    publicUrl,
    isActive
  } = req.body;

  const property = await CreatePropertyService({
    title,
    description,
    type,
    status,
    price,
    area,
    bedrooms,
    bathrooms,
    parkingSpaces,
    address,
    city,
    state,
    zipCode,
    images,
    features,
    publicUrl,
    isActive,
    userId: parseInt(req.user.id)
  });

  return res.status(201).json(property);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { propertyId } = req.params;

  const property = await ShowPropertyService(propertyId);

  return res.status(200).json(property);
};

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { propertyId } = req.params;
  const propertyData = req.body;

  const property = await UpdatePropertyService({
    propertyData,
    propertyId
  });

  return res.status(200).json(property);
};

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { propertyId } = req.params;

  await DeletePropertyService(propertyId);

  return res.status(200).json({ message: "Property deleted" });
};

export const showByPublicUrl = async (req: Request, res: Response): Promise<Response> => {
  const { publicUrl } = req.params;

  const property = await GetPropertyByPublicUrlService(publicUrl);

  return res.status(200).json(property);
};

export const analytics = async (req: Request, res: Response): Promise<Response> => {
  const { propertyId } = req.params;

  const analytics = await GetPropertyAnalyticsService({
    propertyId: parseInt(propertyId)
  });

  return res.status(200).json(analytics);
};

export const advancedSearch = async (req: Request, res: Response): Promise<Response> => {
  const filters = {
    query: req.query.query as string,
    type: req.query.type ? (req.query.type as string).split(",") : undefined,
    status: req.query.status ? (req.query.status as string).split(",") : undefined,
    city: req.query.city ? (req.query.city as string).split(",") : undefined,
    priceMin: req.query.priceMin ? parseFloat(req.query.priceMin as string) : undefined,
    priceMax: req.query.priceMax ? parseFloat(req.query.priceMax as string) : undefined,
    areaMin: req.query.areaMin ? parseFloat(req.query.areaMin as string) : undefined,
    areaMax: req.query.areaMax ? parseFloat(req.query.areaMax as string) : undefined,
    bedrooms: req.query.bedrooms ? (req.query.bedrooms as string).split(",").map(Number) : undefined,
    bathrooms: req.query.bathrooms ? (req.query.bathrooms as string).split(",").map(Number) : undefined,
    parkingSpaces: req.query.parkingSpaces ? (req.query.parkingSpaces as string).split(",").map(Number) : undefined,
    sortBy: req.query.sortBy as string,
    sortOrder: (req.query.sortOrder as "ASC" | "DESC") || "ASC",
    limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
    offset: req.query.offset ? parseInt(req.query.offset as string) : 0
  };

  const result = await AdvancedSearchService(filters);

  return res.status(200).json(result);
};
