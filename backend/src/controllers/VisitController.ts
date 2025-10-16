import { Request, Response } from "express";
import CreateVisitService from "../services/VisitServices/CreateVisitService";
import ListVisitsService from "../services/VisitServices/ListVisitsService";
import UpdateVisitService from "../services/VisitServices/UpdateVisitService";
import DeleteVisitService from "../services/VisitServices/DeleteVisitService";
import ScheduleVisitService from "../services/VisitServices/ScheduleVisitService";
import CheckAvailabilityService from "../services/VisitServices/CheckAvailabilityService";

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { searchParam, pageNumber, status, propertyId, startDate, endDate } = req.query as {
    searchParam?: string;
    pageNumber?: string;
    status?: string;
    propertyId?: string;
    startDate?: string;
    endDate?: string;
  };

  const { visits, count, hasMore } = await ListVisitsService({
    searchParam,
    pageNumber,
    status,
    propertyId,
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined
  });

  return res.json({ visits, count, hasMore });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { propertyId, contactId, scheduledDate, notes } = req.body;

  const visit = await CreateVisitService({
    propertyId,
    contactId,
    userId: parseInt(req.user.id),
    scheduledDate: new Date(scheduledDate),
    notes
  });

  return res.status(201).json(visit);
};

export const update = async (req: Request, res: Response): Promise<Response> => {
  const { visitId } = req.params;
  const visitData = req.body;

  if (visitData.scheduledDate) {
    visitData.scheduledDate = new Date(visitData.scheduledDate);
  }

  const visit = await UpdateVisitService({
    visitData,
    visitId
  });

  return res.status(200).json(visit);
};

export const remove = async (req: Request, res: Response): Promise<Response> => {
  const { visitId } = req.params;

  await DeleteVisitService(visitId);

  return res.status(200).json({ message: "Visit deleted" });
};

export const schedule = async (req: Request, res: Response): Promise<Response> => {
  const { propertyId, contactId, leadId, scheduledDate, notes } = req.body;

  const result = await ScheduleVisitService({
    propertyId,
    contactId,
    leadId,
    scheduledDate: new Date(scheduledDate),
    notes,
    userId: parseInt(req.user.id)
  });

  if (result.conflicts.length > 0) {
    return res.status(409).json({
      message: "Horário indisponível",
      conflicts: result.conflicts,
      suggestions: result.suggestions
    });
  }

  return res.status(201).json(result.visit);
};

export const checkAvailability = async (req: Request, res: Response): Promise<Response> => {
  const { propertyId, date } = req.query;

  if (!propertyId || !date) {
    return res.status(400).json({ error: "propertyId and date are required" });
  }

  const availability = await CheckAvailabilityService({
    propertyId: parseInt(propertyId as string),
    date: new Date(date as string)
  });

  return res.status(200).json({ availability });
};
