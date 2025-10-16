import { Request, Response } from "express";
import PipelineStage from "../models/PipelineStage";
import Lead from "../models/Lead";

export const getStages = async (req: Request, res: Response): Promise<Response> => {
  const stages = await PipelineStage.findAll({
    where: { isActive: true },
    order: [["order", "ASC"]]
  });

  return res.json({ stages });
};

export const getPipeline = async (req: Request, res: Response): Promise<Response> => {
  const stages = await PipelineStage.findAll({
    where: { isActive: true },
    order: [["order", "ASC"]]
  });

  const pipeline = await Promise.all(
    stages.map(async (stage) => {
      const leads = await Lead.findAll({
        where: { stageId: stage.id },
        include: ["assignedUser"],
        order: [["createdAt", "DESC"]]
      });

      return {
        stage,
        leads,
        count: leads.length
      };
    })
  );

  return res.json({ pipeline });
};

export const createStage = async (req: Request, res: Response): Promise<Response> => {
  const { name, color, order } = req.body;

  const stage = await PipelineStage.create({
    name,
    color,
    order
  });

  return res.status(201).json(stage);
};

export const updateStage = async (req: Request, res: Response): Promise<Response> => {
  const { stageId } = req.params;
  const stageData = req.body;

  const stage = await PipelineStage.findByPk(stageId);
  if (!stage) {
    return res.status(404).json({ error: "Stage not found" });
  }

  await stage.update(stageData);

  return res.status(200).json(stage);
};
