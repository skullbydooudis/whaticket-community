import AppError from "../../errors/AppError";
import Property from "../../models/Property";

const DeletePropertyService = async (id: string): Promise<void> => {
  const property = await Property.findByPk(id);

  if (!property) {
    throw new AppError("ERR_NO_PROPERTY_FOUND", 404);
  }

  await property.destroy();
};

export default DeletePropertyService;
