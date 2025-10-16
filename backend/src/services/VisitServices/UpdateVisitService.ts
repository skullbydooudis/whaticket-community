import AppError from "../../errors/AppError";
import Visit from "../../models/Visit";

interface VisitData {
  scheduledDate?: Date;
  status?: string;
  notes?: string;
  feedback?: string;
  interested?: boolean;
}

interface Request {
  visitData: VisitData;
  visitId: string;
}

const UpdateVisitService = async ({
  visitData,
  visitId
}: Request): Promise<Visit> => {
  const visit = await Visit.findByPk(visitId);

  if (!visit) {
    throw new AppError("ERR_NO_VISIT_FOUND", 404);
  }

  await visit.update(visitData);

  await visit.reload();

  return visit;
};

export default UpdateVisitService;
