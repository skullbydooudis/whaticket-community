import { Request, Response } from "express";
import CreatePropertyService from "../services/PropertyServices/CreatePropertyService";
import ListPropertiesService from "../services/PropertyServices/ListPropertiesService";
import ShowPropertyService from "../services/PropertyServices/ShowPropertyService";
import UpdatePropertyService from "../services/PropertyServices/UpdatePropertyService";
import DeletePropertyService from "../services/PropertyServices/DeletePropertyService";
import GetPropertyByPublicUrlService from "../services/PropertyServices/GetPropertyByPublicUrlService";

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
