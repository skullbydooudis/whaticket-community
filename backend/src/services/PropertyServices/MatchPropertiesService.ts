import Property from "../../models/Property";
import Lead from "../../models/Lead";
import { Op } from "sequelize";

interface Request {
  leadId: number;
  limit?: number;
}

interface MatchedProperty extends Property {
  matchScore: number;
  matchReasons: string[];
}

const MatchPropertiesService = async ({ leadId, limit = 20 }: Request): Promise<MatchedProperty[]> => {
  const lead = await Lead.findByPk(leadId);

  if (!lead) {
    throw new Error("Lead not found");
  }

  const whereConditions: any = { isActive: true, status: "available" };
  let properties = await Property.findAll({ where: whereConditions });

  const scoredProperties = properties.map((property) => {
    let matchScore = 0;
    const matchReasons: string[] = [];

    if (lead.propertyType && property.type === lead.propertyType) {
      matchScore += 30;
      matchReasons.push("Tipo de imóvel corresponde");
    }

    if (lead.budgetMin && lead.budgetMax && property.price) {
      if (property.price >= lead.budgetMin && property.price <= lead.budgetMax) {
        matchScore += 40;
        matchReasons.push("Preço dentro do orçamento");
      } else if (property.price >= lead.budgetMin * 0.8 && property.price <= lead.budgetMax * 1.2) {
        matchScore += 20;
        matchReasons.push("Preço próximo ao orçamento");
      }
    }

    if (lead.preferredLocations && lead.preferredLocations.length > 0) {
      if (lead.preferredLocations.includes(property.city)) {
        matchScore += 30;
        matchReasons.push("Localização preferida");
      }
    }

    if (lead.propertyType === "apartment" && property.bedrooms) {
      if (property.bedrooms >= 2 && property.bedrooms <= 3) {
        matchScore += 10;
        matchReasons.push("Número ideal de quartos");
      }
    }

    if (property.features && property.features.length > 5) {
      matchScore += 10;
      matchReasons.push("Imóvel com muitos diferenciais");
    }

    const propertyAge = Math.floor(
      (Date.now() - new Date(property.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (propertyAge <= 7) {
      matchScore += 5;
      matchReasons.push("Imóvel recém-cadastrado");
    }

    const propertyWithScore = property.toJSON() as MatchedProperty;
    propertyWithScore.matchScore = matchScore;
    propertyWithScore.matchReasons = matchReasons;

    return propertyWithScore;
  });

  scoredProperties.sort((a, b) => b.matchScore - a.matchScore);

  return scoredProperties.slice(0, limit);
};

export default MatchPropertiesService;
