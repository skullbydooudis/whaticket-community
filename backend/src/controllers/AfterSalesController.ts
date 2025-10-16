import { Request, Response } from "express";
import CreateAfterSalesService from "../services/AfterSalesServices/CreateAfterSalesService";
import ListAfterSalesService from "../services/AfterSalesServices/ListAfterSalesService";
import UpdateAfterSalesStatusService from "../services/AfterSalesServices/UpdateAfterSalesStatusService";
import UploadDocumentService from "../services/AfterSalesServices/UploadDocumentService";
import ApproveDocumentService from "../services/AfterSalesServices/ApproveDocumentService";
import RejectDocumentService from "../services/AfterSalesServices/RejectDocumentService";
import AfterSales from "../models/AfterSales";
import AfterSalesDocument from "../models/AfterSalesDocument";
import AfterSalesTimeline from "../models/AfterSalesTimeline";
import AfterSalesChecklist from "../models/AfterSalesChecklist";
import Activity from "../models/Activity";

export const index = async (req: Request, res: Response): Promise<Response> => {
  const {
    storeId,
    status,
    type,
    assignedTo,
    searchParam,
    startDate,
    endDate,
    pageNumber
  } = req.query as {
    storeId?: string;
    status?: string;
    type?: string;
    assignedTo?: string;
    searchParam?: string;
    startDate?: string;
    endDate?: string;
    pageNumber?: string;
  };

  const result = await ListAfterSalesService({
    userId: parseInt(req.user.id),
    storeId: storeId ? parseInt(storeId) : undefined,
    status,
    type,
    assignedTo: assignedTo ? parseInt(assignedTo) : undefined,
    searchParam,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
    pageNumber
  });

  return res.json(result);
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const afterSalesData = req.body;

  const afterSales = await CreateAfterSalesService({
    ...afterSalesData,
    userId: parseInt(req.user.id)
  });

  return res.status(201).json(afterSales);
};

export const show = async (req: Request, res: Response): Promise<Response> => {
  const { afterSalesId } = req.params;

  const afterSales = await AfterSales.findByPk(afterSalesId, {
    include: [
      "lead",
      "property",
      "store",
      "assignedUser",
      "proposal"
    ]
  });

  if (!afterSales) {
    return res.status(404).json({ error: "After-sales process not found" });
  }

  const documents = await AfterSalesDocument.findAll({
    where: { afterSalesId },
    include: ["uploader", "verifier"],
    order: [["createdAt", "DESC"]]
  });

  const timeline = await AfterSalesTimeline.findAll({
    where: { afterSalesId },
    include: ["user"],
    order: [["eventDate", "DESC"]],
    limit: 50
  });

  const checklist = await AfterSalesChecklist.findAll({
    where: { afterSalesId },
    include: [{ association: "completedByUser", attributes: ["id", "name"] }],
    order: [["order", "ASC"]]
  });

  const checklistProgress = {
    total: checklist.length,
    completed: checklist.filter(item => item.isCompleted).length,
    required: checklist.filter(item => item.isRequired).length,
    requiredCompleted: checklist.filter(item => item.isRequired && item.isCompleted).length,
    percentage: checklist.length > 0
      ? Math.round((checklist.filter(item => item.isCompleted).length / checklist.length) * 100)
      : 0
  };

  return res.json({
    afterSales,
    documents,
    timeline,
    checklist,
    checklistProgress
  });
};

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { afterSalesId } = req.params;
  const updateData = req.body;

  const afterSales = await AfterSales.findByPk(afterSalesId);
  if (!afterSales) {
    return res.status(404).json({ error: "After-sales process not found" });
  }

  await afterSales.update(updateData);

  await Activity.create({
    type: "after_sales_updated",
    description: `Pós-venda ${afterSales.code} atualizado`,
    entityType: "after_sales",
    entityId: afterSales.id,
    userId: parseInt(req.user.id),
    metadata: { changes: updateData }
  });

  return res.json(afterSales);
};

export const updateStatus = async (req: Request, res: Response): Promise<Response> => {
  const { afterSalesId } = req.params;
  const { status, notes } = req.body;

  const afterSales = await UpdateAfterSalesStatusService({
    afterSalesId: parseInt(afterSalesId),
    status,
    notes,
    userId: parseInt(req.user.id)
  });

  return res.json(afterSales);
};

export const uploadDocument = async (req: Request, res: Response): Promise<Response> => {
  const { afterSalesId } = req.params;
  const {
    documentType,
    documentName,
    documentUrl,
    fileSize,
    mimeType,
    expiryDate,
    notes
  } = req.body;

  const document = await UploadDocumentService({
    afterSalesId: parseInt(afterSalesId),
    documentType,
    documentName,
    documentUrl,
    fileSize,
    mimeType,
    expiryDate: expiryDate ? new Date(expiryDate) : undefined,
    notes,
    userId: parseInt(req.user.id)
  });

  return res.status(201).json(document);
};

export const approveDocument = async (req: Request, res: Response): Promise<Response> => {
  const { documentId } = req.params;
  const { notes } = req.body;

  const document = await ApproveDocumentService({
    documentId: parseInt(documentId),
    notes,
    userId: parseInt(req.user.id)
  });

  return res.json(document);
};

export const rejectDocument = async (req: Request, res: Response): Promise<Response> => {
  const { documentId } = req.params;
  const { rejectionReason } = req.body;

  if (!rejectionReason) {
    return res.status(400).json({ error: "Rejection reason is required" });
  }

  const document = await RejectDocumentService({
    documentId: parseInt(documentId),
    rejectionReason,
    userId: parseInt(req.user.id)
  });

  return res.json(document);
};

export const listDocuments = async (req: Request, res: Response): Promise<Response> => {
  const { afterSalesId } = req.params;
  const { status, documentType } = req.query;

  const where: any = { afterSalesId: parseInt(afterSalesId) };
  if (status) where.status = status;
  if (documentType) where.documentType = documentType;

  const documents = await AfterSalesDocument.findAll({
    where,
    include: ["uploader", "verifier"],
    order: [["createdAt", "DESC"]]
  });

  return res.json({ documents });
};

export const addTimelineEvent = async (req: Request, res: Response): Promise<Response> => {
  const { afterSalesId } = req.params;
  const { eventType, eventTitle, eventDescription, metadata } = req.body;

  const event = await AfterSalesTimeline.create({
    afterSalesId: parseInt(afterSalesId),
    eventType,
    eventTitle,
    eventDescription,
    eventDate: new Date(),
    userId: parseInt(req.user.id),
    metadata: metadata || {}
  });

  return res.status(201).json(event);
};

export const completeChecklistItem = async (req: Request, res: Response): Promise<Response> => {
  const { itemId } = req.params;
  const { notes } = req.body;

  const item = await AfterSalesChecklist.findByPk(itemId);
  if (!item) {
    return res.status(404).json({ error: "Checklist item not found" });
  }

  item.isCompleted = true;
  item.completedBy = parseInt(req.user.id);
  item.completedAt = new Date();
  if (notes) {
    item.notes = notes;
  }

  await item.save();

  await AfterSalesTimeline.create({
    afterSalesId: item.afterSalesId,
    eventType: "other",
    eventTitle: `Checklist: ${item.itemName} concluído`,
    eventDescription: notes || `Item do checklist marcado como concluído`,
    eventDate: new Date(),
    userId: parseInt(req.user.id),
    metadata: { checklistItemId: item.id }
  });

  return res.json(item);
};

export const addChecklistItem = async (req: Request, res: Response): Promise<Response> => {
  const { afterSalesId } = req.params;
  const { category, itemName, description, isRequired, dueDate, order } = req.body;

  const item = await AfterSalesChecklist.create({
    afterSalesId: parseInt(afterSalesId),
    category,
    itemName,
    description,
    isRequired: isRequired || false,
    isCompleted: false,
    dueDate: dueDate ? new Date(dueDate) : undefined,
    order: order || 999
  });

  return res.status(201).json(item);
};

export const dashboard = async (req: Request, res: Response): Promise<Response> => {
  const { storeId } = req.query;

  const where: any = {};
  if (storeId) {
    where.storeId = parseInt(storeId as string);
  }

  const all = await AfterSales.findAll({ where });

  const summary = {
    total: all.length,
    active: all.filter(a => !["completed", "cancelled"].includes(a.status)).length,
    completed: all.filter(a => a.status === "completed").length,
    cancelled: all.filter(a => a.status === "cancelled").length
  };

  const byStatus: Record<string, number> = {};
  const byType: Record<string, number> = {};

  all.forEach(a => {
    byStatus[a.status] = (byStatus[a.status] || 0) + 1;
    byType[a.type] = (byType[a.type] || 0) + 1;
  });

  const completedProcesses = all.filter(a =>
    a.status === "completed" && a.actualDeliveryDate
  );

  let avgDuration = 0;
  if (completedProcesses.length > 0) {
    const totalDays = completedProcesses.reduce((sum, a) => {
      const start = new Date(a.createdAt).getTime();
      const end = new Date(a.actualDeliveryDate).getTime();
      return sum + ((end - start) / (1000 * 60 * 60 * 24));
    }, 0);
    avgDuration = Math.round(totalDays / completedProcesses.length);
  }

  const revenue = {
    totalSales: all.reduce((sum, a) => sum + (a.saleValue || 0), 0),
    totalCommissions: all.reduce((sum, a) => sum + (a.commissionValue || 0), 0),
    avgCommission: all.length > 0
      ? Math.round(all.reduce((sum, a) => sum + (a.commissionValue || 0), 0) / all.length)
      : 0
  };

  return res.json({
    summary: { ...summary, avgDuration },
    byStatus,
    byType,
    revenue
  });
};
