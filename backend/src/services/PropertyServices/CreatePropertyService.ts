import AppError from "../../errors/AppError";
import Property from "../../models/Property";

interface Request {
  title: string;
  description?: string;
  type: string;
  status: string;
  price: number;
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
  userId: number;
}

const CreatePropertyService = async ({
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
  userId
}: Request): Promise<Property> => {
  const property = await Property.create({
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
    userId
  });

  return property;
};

export default CreatePropertyService;
