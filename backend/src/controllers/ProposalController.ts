import { Request, Response } from "express";
import Proposal from "../models/Proposal";
import Activity from "../models/Activity";
import GenerateProposalService from "../services/ProposalServices/GenerateProposalService";
import SendProposalService from "../services/ProposalServices/SendProposalService";
import UpdateProposalStatusService from "../services/ProposalServices/UpdateProposalStatusService";
import { v4 as uuidv4 } from "uuid";

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { status, leadId, propertyId } = req.query;
  const whereCondition: any = {};

  if (status) whereCondition.status = status;
  if (leadId) whereCondition.leadId = leadId;
  if (propertyId) whereCondition.propertyId = propertyId;

  const proposals = await Proposal.findAll({
    where: whereCondition,
    order: [["createdAt", "DESC"]],
    include: ["lead", "property", "contact", "creator"]
  });

  return res.json({ proposals });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const proposalData = req.body;

  const proposalNumber = `PROP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  const proposal = await Proposal.create({
    ...proposalData,
    proposalNumber,
    createdBy: parseInt(req.user.id)
  });

  await Activity.create({
    type: "proposal_created",
    description: `Proposta ${proposal.proposalNumber} criada`,
    entityType: "proposal",
    entityId: proposal.id,
    userId: parseInt(req.user.id)
  });

  return res.status(201).json(proposal);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { proposalId } = req.params;

  const proposal = await Proposal.findByPk(proposalId, {
    include: ["lead", "property", "contact", "creator"]
  });

  return res.status(200).json(proposal);
};

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { proposalId } = req.params;
  const proposalData = req.body;

  const proposal = await Proposal.findByPk(proposalId);
  if (!proposal) {
    return res.status(404).json({ error: "Proposal not found" });
  }

  await proposal.update(proposalData);

  await Activity.create({
    type: "proposal_updated",
    description: `Proposta ${proposal.proposalNumber} atualizada`,
    entityType: "proposal",
    entityId: proposal.id,
    userId: parseInt(req.user.id)
  });

  return res.status(200).json(proposal);
};

export const updateStatus = async (req: Request, res: Response): Promise<Response> => {
  const { proposalId } = req.params;
  const { status } = req.body;

  const proposal = await Proposal.findByPk(proposalId);
  if (!proposal) {
    return res.status(404).json({ error: "Proposal not found" });
  }

  const oldStatus = proposal.status;
  await proposal.update({
    status,
    ...(status === "sent" && !proposal.sentAt ? { sentAt: new Date() } : {}),
    ...(status === "accepted" && !proposal.respondedAt ? { respondedAt: new Date() } : {}),
    ...(status === "rejected" && !proposal.respondedAt ? { respondedAt: new Date() } : {})
  });

  await Activity.create({
    type: "proposal_status_changed",
    description: `Status da proposta ${proposal.proposalNumber} alterado de ${oldStatus} para ${status}`,
    entityType: "proposal",
    entityId: proposal.id,
    userId: parseInt(req.user.id),
    metadata: { oldStatus, newStatus: status }
  });

  return res.status(200).json(proposal);
};

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { proposalId } = req.params;

  const proposal = await Proposal.findByPk(proposalId);
  if (!proposal) {
    return res.status(404).json({ error: "Proposal not found" });
  }

  await proposal.destroy();

  return res.status(200).json({ message: "Proposal deleted" });
};

export const generate = async (req: Request, res: Response): Promise<Response> => {
  const {
    leadId,
    propertyId,
    proposedValue,
    downPayment,
    installments,
    installmentValue,
    notes,
    template
  } = req.body;

  const proposal = await GenerateProposalService({
    leadId,
    propertyId,
    proposedValue,
    downPayment,
    installments,
    installmentValue,
    notes,
    template,
    userId: parseInt(req.user.id)
  });

  return res.status(201).json(proposal);
};

export const send = async (req: Request, res: Response): Promise<Response> => {
  const { proposalId } = req.params;
  const { sendNotification = true } = req.body;

  const proposal = await SendProposalService({
    proposalId: parseInt(proposalId),
    userId: parseInt(req.user.id),
    sendNotification
  });

  return res.status(200).json(proposal);
};

export const changeStatus = async (req: Request, res: Response): Promise<Response> => {
  const { proposalId } = req.params;
  const { status, rejectionReason } = req.body;

  const proposal = await UpdateProposalStatusService({
    proposalId: parseInt(proposalId),
    status,
    userId: parseInt(req.user.id),
    rejectionReason
  });

  return res.status(200).json(proposal);
};
