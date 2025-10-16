import { Request, Response } from "express";
import CreateActivityService from "../services/ActivityServices/CreateActivityService";
import ListActivitiesService from "../services/ActivityServices/ListActivitiesService";

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { entityType, entityId, userId, type, limit } = req.query;

  const { activities, count } = await ListActivitiesService({
    entityType: entityType as string,
    entityId: entityId ? parseInt(entityId as string) : undefined,
    userId: userId ? parseInt(userId as string) : undefined,
    type: type as string,
    limit: limit ? parseInt(limit as string) : undefined
  });

  return res.json({ activities, count });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { type, description, entityType, entityId, metadata } = req.body;
  const userId = parseInt(req.user.id);

  const activity = await CreateActivityService({
    type,
    description,
    entityType,
    entityId,
    userId,
    metadata
  });

  return res.status(201).json(activity);
};
