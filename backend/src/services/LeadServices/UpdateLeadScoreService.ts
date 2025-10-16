import Lead from "../../models/Lead";
import Activity from "../../models/Activity";
import CalculateLeadScoreService from "./CalculateLeadScoreService";

interface Request {
  leadId: number;
  userId: number;
}

const UpdateLeadScoreService = async ({ leadId, userId }: Request): Promise<Lead> => {
  const lead = await Lead.findByPk(leadId, {
    include: [{ association: "activities" }]
  });

  if (!lead) {
    throw new Error("Lead not found");
  }

  const contactCount = lead.activities ? lead.activities.filter(
    (a: any) => a.type === "contact" || a.type === "call" || a.type === "email"
  ).length : 0;

  const daysAsLead = Math.floor(
    (Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  const newScore = CalculateLeadScoreService({
    email: lead.email,
    phone: lead.phone,
    budgetMin: lead.budgetMin,
    budgetMax: lead.budgetMax,
    propertyType: lead.propertyType,
    preferredLocations: lead.preferredLocations,
    source: lead.source,
    contactCount,
    daysAsLead
  });

  const oldScore = lead.score;
  lead.score = newScore;
  await lead.save();

  if (oldScore !== newScore) {
    await Activity.create({
      type: "score_updated",
      description: `Score atualizado de ${oldScore} para ${newScore}`,
      entityType: "lead",
      entityId: lead.id,
      userId,
      metadata: { oldScore, newScore }
    });
  }

  return lead;
};

export default UpdateLeadScoreService;
