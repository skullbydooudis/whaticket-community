import AppError from "../../errors/AppError";
import Visit from "../../models/Visit";

const DeleteVisitService = async (id: string): Promise<void> => {
  const visit = await Visit.findByPk(id);

  if (!visit) {
    throw new AppError("ERR_NO_VISIT_FOUND", 404);
  }

  await visit.destroy();
};

export default DeleteVisitService;
