import Activity from "../../models/Activity";

interface Request {
  type: string;
  description: string;
  entityType: string;
  entityId: number;
  userId: number;
  metadata?: any;
}

const CreateActivityService = async (data: Request): Promise<Activity> => {
  const activity = await Activity.create({
    type: data.type,
    description: data.description,
    entityType: data.entityType,
    entityId: data.entityId,
    userId: data.userId,
    metadata: data.metadata
  });

  return activity;
};

export default CreateActivityService;
