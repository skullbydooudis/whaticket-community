import Lead from "../../models/Lead";
import Activity from "../../models/Activity";

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
  const lead = await Lead.create({
    name: data.name,
    email: data.email,
    phone: data.phone,
    source: data.source || "website",
    status: data.status || "new",
    score: data.score || 0,
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
