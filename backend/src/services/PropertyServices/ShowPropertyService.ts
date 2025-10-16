import AppError from "../../errors/AppError";
import Property from "../../models/Property";
import User from "../../models/User";
import Visit from "../../models/Visit";

const ShowPropertyService = async (id: string): Promise<Property> => {
  const property = await Property.findByPk(id, {
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "name", "email"]
      },
      {
        model: Visit,
        as: "visits",
        separate: true,
        order: [["scheduledDate", "DESC"]]
      }
    ]
  });

  if (!property) {
    throw new AppError("ERR_NO_PROPERTY_FOUND", 404);
  }

  return property;
};

export default ShowPropertyService;
