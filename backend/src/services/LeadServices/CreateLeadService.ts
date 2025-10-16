import Lead from "../../models/Lead";
import Activity from "../../models/Activity";
import CalculateLeadScoreService from "./CalculateLeadScoreService";

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
    name: data.name,
    email: data.email,
    phone: data.phone,
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
    metadata: { source: data.source }
  });

  return lead;
};

export default CreateLeadService;
