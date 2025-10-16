import { Request, Response } from "express";
import CreateLeadService from "../services/LeadServices/CreateLeadService";
import ListLeadsService from "../services/LeadServices/ListLeadsService";
import QualifyLeadService from "../services/LeadServices/QualifyLeadService";
import MatchPropertiesService from "../services/PropertyServices/MatchPropertiesService";
import Lead from "../models/Lead";
import Activity from "../models/Activity";

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber, status, source, assignedTo, stageId } = req.query as {
    searchParam?: string;
    pageNumber?: string;
    status?: string;
    source?: string;
    assignedTo?: string;
    stageId?: string;
  };

  const { leads, count, hasMore } = await ListLeadsService({
    searchParam,
    pageNumber,
    status,
    source,
    assignedTo: assignedTo ? parseInt(assignedTo) : undefined,
    stageId
  });

  return res.json({ leads, count, hasMore });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const leadData = req.body;

  const lead = await CreateLeadService({
    ...leadData,
    userId: parseInt(req.user.id)
  });

  return res.status(201).json(lead);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { leadId } = req.params;

  const lead = await Lead.findByPk(leadId, {
    include: ["assignedUser", "contact", "tasks", "proposals"]
  });

  return res.status(200).json(lead);
};

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { leadId } = req.params;
  const leadData = req.body;

  const lead = await Lead.findByPk(leadId);
  if (!lead) {
    return res.status(404).json({ error: "Lead not found" });
  }

  await lead.update(leadData);

  await Activity.create({
    type: "lead_updated",
    description: `Lead ${lead.name} atualizado`,
    entityType: "lead",
    entityId: lead.id,
    userId: parseInt(req.user.id),
    metadata: { changes: leadData }
  });

  return res.status(200).json(lead);
};

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { leadId } = req.params;

  const lead = await Lead.findByPk(leadId);
  if (!lead) {
    return res.status(404).json({ error: "Lead not found" });
  }

  await lead.destroy();

  return res.status(200).json({ message: "Lead deleted" });
};

export const updateStage = async (req: Request, res: Response): Promise<Response> => {
  const { leadId } = req.params;
  const { stageId } = req.body;

  const lead = await Lead.findByPk(leadId);
  if (!lead) {
    return res.status(404).json({ error: "Lead not found" });
  }

  const oldStage = lead.stageId;
  await lead.update({ stageId });

  await Activity.create({
    type: "lead_stage_changed",
    description: `Lead ${lead.name} movido no pipeline`,
    entityType: "lead",
    entityId: lead.id,
    userId: parseInt(req.user.id),
    metadata: { oldStage, newStage: stageId }
  });

  return res.status(200).json(lead);
};

export const qualify = async (req: Request, res: Response): Promise<Response> => {
  const { leadId } = req.params;

  const result = await QualifyLeadService({
    leadId: parseInt(leadId),
    userId: parseInt(req.user.id)
  });

  return res.status(200).json(result);
};

export const matchProperties = async (req: Request, res: Response): Promise<Response> => {
  const { leadId } = req.params;
  const { limit } = req.query;

  const properties = await MatchPropertiesService({
    leadId: parseInt(leadId),
    limit: limit ? parseInt(limit as string) : undefined
  });

  return res.status(200).json({ properties });
};
