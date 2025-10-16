import { Request, Response } from "express";
import Task from "../models/Task";
import Activity from "../models/Activity";
import { Op } from "sequelize";

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { status, assignedTo, leadId, dueDate } = req.query;
  const whereCondition: any = {};

  if (status) whereCondition.status = status;
  if (assignedTo) whereCondition.assignedTo = parseInt(assignedTo as string);
  if (leadId) whereCondition.leadId = leadId;
  if (dueDate) {
    whereCondition.dueDate = {
      [Op.lte]: new Date(dueDate as string)
    };
  }

  const tasks = await Task.findAll({
    where: whereCondition,
    order: [["dueDate", "ASC"]],
    include: ["assignedUser", "creator", "lead", "property", "contact"]
  });

  return res.json({ tasks });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const taskData = req.body;

  const task = await Task.create({
    ...taskData,
    createdBy: parseInt(req.user.id)
  });

  await Activity.create({
    type: "task_created",
    description: `Tarefa "${task.title}" criada`,
    entityType: "task",
    entityId: task.id,
    userId: parseInt(req.user.id)
  });

  return res.status(201).json(task);
};

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { taskId } = req.params;
  const taskData = req.body;

  const task = await Task.findByPk(taskId);
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }

  await task.update(taskData);

  return res.status(200).json(task);
};

export const complete = async (req: Request, res: Response): Promise<Response> => {
  const { taskId } = req.params;

  const task = await Task.findByPk(taskId);
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }

  await task.update({
    status: "completed",
    completedAt: new Date()
  });

  await Activity.create({
    type: "task_completed",
    description: `Tarefa "${task.title}" concluída`,
    entityType: "task",
    entityId: task.id,
    userId: parseInt(req.user.id)
  });

  return res.status(200).json(task);
};

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { taskId } = req.params;

  const task = await Task.findByPk(taskId);
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }

  await task.destroy();

  return res.status(200).json({ message: "Task deleted" });
};
