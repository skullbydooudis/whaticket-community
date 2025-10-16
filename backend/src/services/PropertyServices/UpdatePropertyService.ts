import AppError from "../../errors/AppError";
import Property from "../../models/Property";

interface PropertyData {
  title?: string;
  description?: string;
  type?: string;
  status?: string;
  price?: number;
  area?: number;
  bedrooms?: number;
  bathrooms?: number;
  parkingSpaces?: number;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  images?: string[];
  features?: string[];
  publicUrl?: string;
  isActive?: boolean;
}

interface Request {
  propertyData: PropertyData;
  propertyId: string;
}

const UpdatePropertyService = async ({
  propertyData,
  propertyId
}: Request): Promise<Property> => {
  const property = await Property.findByPk(propertyId);

  if (!property) {
    throw new AppError("ERR_NO_PROPERTY_FOUND", 404);
  }

  await property.update(propertyData);

  await property.reload();

  return property;
};

export default UpdatePropertyService;
