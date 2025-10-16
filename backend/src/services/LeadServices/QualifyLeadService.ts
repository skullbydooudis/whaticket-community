import Lead from "../../models/Lead";
import Property from "../../models/Property";
import Activity from "../../models/Activity";
import { Op } from "sequelize";

interface Request {
  leadId: number;
  userId: number;
}

interface QualificationResult {
  isQualified: boolean;
  matchingProperties: Property[];
  recommendations: string[];
  nextActions: string[];
  qualificationScore: number;
}

const QualifyLeadService = async ({ leadId, userId }: Request): Promise<QualificationResult> => {
  const lead = await Lead.findByPk(leadId, {
    include: [{ association: "contact" }, { association: "activities" }]
  });

  if (!lead) {
    throw new Error("Lead not found");
  }

  let qualificationScore = 0;
  const recommendations: string[] = [];
  const nextActions: string[] = [];

  if (!lead.email && !lead.phone) {
    recommendations.push("Obter informações de contato completas");
    nextActions.push("Solicitar email e telefone");
  } else {
    qualificationScore += 20;
  }

  if (!lead.budgetMin || !lead.budgetMax) {
    recommendations.push("Definir orçamento do cliente");
    nextActions.push("Agendar conversa para entender capacidade financeira");
  } else {
    qualificationScore += 30;
  }

  if (!lead.propertyType) {
    recommendations.push("Identificar tipo de imóvel desejado");
    nextActions.push("Perguntar sobre preferências de tipo de imóvel");
  } else {
    qualificationScore += 15;
  }

  if (!lead.preferredLocations || lead.preferredLocations.length === 0) {
    recommendations.push("Definir localizações de interesse");
    nextActions.push("Mapear bairros e regiões preferidas");
  } else {
    qualificationScore += 15;
  }

  const hasRecentActivity = lead.activities && lead.activities.some((a: any) => {
    const activityDate = new Date(a.createdAt);
    const daysSinceActivity = (Date.now() - activityDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceActivity <= 7;
  });

  if (!hasRecentActivity) {
    recommendations.push("Reativar contato com o lead");
    nextActions.push("Enviar mensagem de follow-up");
  } else {
    qualificationScore += 20;
  }

  const whereConditions: any = { isActive: true };

  if (lead.propertyType) {
    whereConditions.type = lead.propertyType;
  }

  if (lead.budgetMin && lead.budgetMax) {
    whereConditions.price = {
      [Op.gte]: lead.budgetMin * 0.8,
      [Op.lte]: lead.budgetMax * 1.2
    };
  }

  if (lead.preferredLocations && lead.preferredLocations.length > 0) {
    whereConditions.city = {
      [Op.in]: lead.preferredLocations
    };
  }

  const matchingProperties = await Property.findAll({
    where: whereConditions,
    limit: 10,
    order: [["createdAt", "DESC"]]
  });

  if (matchingProperties.length > 0) {
    nextActions.push(`Apresentar ${matchingProperties.length} imóveis compatíveis`);
    qualificationScore += 20;
  } else {
    recommendations.push("Expandir critérios de busca ou aguardar novos imóveis");
  }

  const isQualified = qualificationScore >= 70;

  if (isQualified && lead.status !== "qualified") {
    lead.status = "qualified";
    await lead.save();

    await Activity.create({
      type: "lead_qualified",
      description: `Lead qualificado com score ${qualificationScore}`,
      entityType: "lead",
      entityId: lead.id,
      userId,
      metadata: {
        qualificationScore,
        matchingPropertiesCount: matchingProperties.length
      }
    });
  }

  return {
    isQualified,
    matchingProperties,
    recommendations,
    nextActions,
    qualificationScore
  };
};

export default QualifyLeadService;
