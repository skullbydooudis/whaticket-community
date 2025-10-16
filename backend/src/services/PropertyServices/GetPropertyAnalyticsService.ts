import Property from "../../models/Property";
import Visit from "../../models/Visit";
import Proposal from "../../models/Proposal";
import { Op } from "sequelize";

interface Request {
  propertyId: number;
}

interface Analytics {
  property: Property;
  totalViews: number;
  totalVisits: number;
  scheduledVisits: number;
  completedVisits: number;
  totalProposals: number;
  acceptedProposals: number;
  avgProposalValue: number;
  conversionRate: number;
  daysOnMarket: number;
  viewsPerDay: number;
  lastActivity: Date | null;
}

const GetPropertyAnalyticsService = async ({ propertyId }: Request): Promise<Analytics> => {
  const property = await Property.findByPk(propertyId, {
    include: [
      { association: "visits" },
      { association: "proposals" }
    ]
  });

  if (!property) {
    throw new Error("Property not found");
  }

  const totalViews = property.views || 0;

  const visits = await Visit.findAll({
    where: { propertyId }
  });

  const totalVisits = visits.length;
  const scheduledVisits = visits.filter(v => v.status === "scheduled").length;
  const completedVisits = visits.filter(v => v.status === "completed").length;

  const proposals = await Proposal.findAll({
    where: { propertyId }
  });

  const totalProposals = proposals.length;
  const acceptedProposals = proposals.filter(p => p.status === "accepted").length;

  const avgProposalValue = proposals.length > 0
    ? proposals.reduce((sum, p) => sum + (p.proposedValue || 0), 0) / proposals.length
    : 0;

  const conversionRate = totalVisits > 0
    ? (acceptedProposals / totalVisits) * 100
    : 0;

  const daysOnMarket = Math.floor(
    (Date.now() - new Date(property.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  const viewsPerDay = daysOnMarket > 0 ? totalViews / daysOnMarket : totalViews;

  const lastVisit = visits.length > 0
    ? visits.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    : null;

  const lastProposal = proposals.length > 0
    ? proposals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    : null;

  let lastActivity = null;
  if (lastVisit && lastProposal) {
    lastActivity = new Date(lastVisit.createdAt) > new Date(lastProposal.createdAt)
      ? new Date(lastVisit.createdAt)
      : new Date(lastProposal.createdAt);
  } else if (lastVisit) {
    lastActivity = new Date(lastVisit.createdAt);
  } else if (lastProposal) {
    lastActivity = new Date(lastProposal.createdAt);
  }

  return {
    property,
    totalViews,
    totalVisits,
    scheduledVisits,
    completedVisits,
    totalProposals,
    acceptedProposals,
    avgProposalValue,
    conversionRate,
    daysOnMarket,
    viewsPerDay,
    lastActivity
  };
};

export default GetPropertyAnalyticsService;
