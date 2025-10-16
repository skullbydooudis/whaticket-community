import Lead from "../../models/Lead";
import Activity from "../../models/Activity";
import CalculateLeadScoreService from "./CalculateLeadScoreService";
import cacheService from "../CacheService";
import workerManager from "../../workers";
import logger from "../../utils/logger";
import AppError from "../../errors/AppError";

interface Request {
  name: string;
  email?: string;
  phone?: string;
  source?: string;
  status?: string;
  score?: number;
  budgetMin?: number;
  budgetMax?: number;
  propertyType?: string;
  preferredLocations?: string[];
  notes?: string;
  assignedTo?: number;
  stageId?: string;
  contactId?: number;
  userId: number;
}

const CreateLeadService = async (data: Request): Promise<Lead> => {
  try {
    if (!data.name || data.name.trim().length < 2) {
      throw new AppError("Nome do lead deve ter pelo menos 2 caracteres", 400);
    }

    if (!data.phone && !data.email) {
      throw new AppError("Lead deve ter pelo menos telefone ou email", 400);
    }

    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        throw new AppError("Email inválido", 400);
      }
    }

    const existingLead = await Lead.findOne({
      where: {
        ...(data.email ? { email: data.email } : {}),
        ...(data.phone ? { phone: data.phone } : {})
      }
    });

    if (existingLead) {
      logger.warn(`Tentativa de criar lead duplicado: ${data.email || data.phone}`);
      throw new AppError("Lead já existe com este email ou telefone", 409);
    }

    const calculatedScore = CalculateLeadScoreService({
      email: data.email,
      phone: data.phone,
      budgetMin: data.budgetMin,
      budgetMax: data.budgetMax,
      propertyType: data.propertyType,
      preferredLocations: data.preferredLocations,
      source: data.source,
      daysAsLead: 0
    });

    const lead = await Lead.create({
      name: data.name.trim(),
      email: data.email?.toLowerCase().trim(),
      phone: data.phone?.replace(/\D/g, ""),
      source: data.source || "website",
      status: data.status || "new",
      score: data.score !== undefined ? data.score : calculatedScore,
      budgetMin: data.budgetMin,
      budgetMax: data.budgetMax,
      propertyType: data.propertyType,
      preferredLocations: data.preferredLocations,
      notes: data.notes,
      assignedTo: data.assignedTo,
      stageId: data.stageId,
      contactId: data.contactId
    });

    await Activity.create({
      type: "lead_created",
      description: `Lead ${lead.name} criado`,
      entityType: "lead",
      entityId: lead.id,
      userId: data.userId,
      metadata: {
        source: data.source,
        score: calculatedScore,
        hasEmail: !!data.email,
        hasPhone: !!data.phone
      }
    });

    await cacheService.invalidateByTags(["leads", "leads:list"]);

    const notificationWorker = workerManager.getWorker("notification");
    if (notificationWorker) {
      await notificationWorker.addJob("new_lead", {
        type: "new_lead",
        leadId: lead.id,
        metadata: {
          userId: data.userId,
          source: data.source
        }
      }).catch(error => {
        logger.error("Failed to queue lead notification:", error);
      });
    }

    const emailWorker = workerManager.getWorker("email");
    if (emailWorker && data.email) {
      await emailWorker.addJob("welcome_email", {
        to: data.email,
        subject: "Bem-vindo! Estamos aqui para ajudar",
        template: "welcome_lead",
        templateData: {
          name: data.name,
          source: data.source
        }
      }).catch(error => {
        logger.error("Failed to queue welcome email:", error);
      });
    }

    logger.info(`Lead created successfully: ${lead.id} - ${lead.name}`, {
      leadId: lead.id,
      source: data.source,
      score: calculatedScore,
      userId: data.userId
    });

    return lead;
  } catch (error) {
    logger.error("Error creating lead:", error);
    throw error;
  }
};

export default CreateLeadService;
