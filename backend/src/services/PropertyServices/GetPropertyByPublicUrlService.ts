import AppError from "../../errors/AppError";
import Property from "../../models/Property";
import User from "../../models/User";

const GetPropertyByPublicUrlService = async (publicUrl: string): Promise<Property> => {
  const property = await Property.findOne({
    where: {
      publicUrl,
      isActive: true
    },
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "name", "email"]
      }
    ]
  });

  if (!property) {
    throw new AppError("ERR_NO_PROPERTY_FOUND", 404);
  }

  return property;
};

export default GetPropertyByPublicUrlService;
