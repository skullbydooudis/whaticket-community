import Lead from "../../models/Lead";
import Property from "../../models/Property";
import Visit from "../../models/Visit";
import Proposal from "../../models/Proposal";
import Ticket from "../../models/Ticket";
import { Op } from "sequelize";

interface DashboardStats {
  leads: {
    total: number;
    new: number;
    active: number;
    converted: number;
    avgScore: number;
  };
  properties: {
    total: number;
    available: number;
    sold: number;
    rented: number;
    avgPrice: number;
  };
  visits: {
    total: number;
    scheduled: number;
    completed: number;
    cancelled: number;
    conversionRate: number;
  };
  proposals: {
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
    avgValue: number;
  };
  tickets: {
    total: number;
    open: number;
    pending: number;
    closed: number;
  };
  performance: {
    leadsThisMonth: number;
    leadsLastMonth: number;
    leadsGrowth: number;
    proposalsThisMonth: number;
    proposalsLastMonth: number;
    proposalsGrowth: number;
  };
}

const GetDashboardStatsService = async (): Promise<DashboardStats> => {
  const now = new Date();
  const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const leads = await Lead.findAll();
  const totalLeads = leads.length;
  const newLeads = leads.filter(l => l.status === "new").length;
  const activeLeads = leads.filter(l => l.status === "active").length;
  const convertedLeads = leads.filter(l => l.status === "converted").length;
  const avgScore = totalLeads > 0
    ? leads.reduce((sum, l) => sum + (l.score || 0), 0) / totalLeads
    : 0;

  const properties = await Property.findAll();
  const totalProperties = properties.length;
  const availableProperties = properties.filter(p => p.status === "available").length;
  const soldProperties = properties.filter(p => p.status === "sold").length;
  const rentedProperties = properties.filter(p => p.status === "rented").length;
  const avgPrice = totalProperties > 0
    ? properties.reduce((sum, p) => sum + (p.price || 0), 0) / totalProperties
    : 0;

  const visits = await Visit.findAll();
  const totalVisits = visits.length;
  const scheduledVisits = visits.filter(v => v.status === "scheduled").length;
  const completedVisits = visits.filter(v => v.status === "completed").length;
  const cancelledVisits = visits.filter(v => v.status === "cancelled").length;

  const proposals = await Proposal.findAll();
  const totalProposals = proposals.length;
  const pendingProposals = proposals.filter(p => p.status === "draft" || p.status === "sent").length;
  const acceptedProposals = proposals.filter(p => p.status === "accepted").length;
  const rejectedProposals = proposals.filter(p => p.status === "rejected").length;
  const avgProposalValue = totalProposals > 0
    ? proposals.reduce((sum, p) => sum + (p.proposedValue || 0), 0) / totalProposals
    : 0;

  const visitConversionRate = completedVisits > 0
    ? (acceptedProposals / completedVisits) * 100
    : 0;

  const tickets = await Ticket.findAll();
  const totalTickets = tickets.length;
  const openTickets = tickets.filter(t => t.status === "open").length;
  const pendingTickets = tickets.filter(t => t.status === "pending").length;
  const closedTickets = tickets.filter(t => t.status === "closed").length;

  const leadsThisMonth = await Lead.count({
    where: {
      createdAt: { [Op.gte]: firstDayThisMonth }
    }
  });

  const leadsLastMonth = await Lead.count({
    where: {
      createdAt: {
        [Op.gte]: firstDayLastMonth,
        [Op.lte]: lastDayLastMonth
      }
    }
  });

  const leadsGrowth = leadsLastMonth > 0
    ? ((leadsThisMonth - leadsLastMonth) / leadsLastMonth) * 100
    : 0;

  const proposalsThisMonth = await Proposal.count({
    where: {
      createdAt: { [Op.gte]: firstDayThisMonth }
    }
  });

  const proposalsLastMonth = await Proposal.count({
    where: {
      createdAt: {
        [Op.gte]: firstDayLastMonth,
        [Op.lte]: lastDayLastMonth
      }
    }
  });

  const proposalsGrowth = proposalsLastMonth > 0
    ? ((proposalsThisMonth - proposalsLastMonth) / proposalsLastMonth) * 100
    : 0;

  return {
    leads: {
      total: totalLeads,
      new: newLeads,
      active: activeLeads,
      converted: convertedLeads,
      avgScore: Math.round(avgScore)
    },
    properties: {
      total: totalProperties,
      available: availableProperties,
      sold: soldProperties,
      rented: rentedProperties,
      avgPrice: Math.round(avgPrice)
    },
    visits: {
      total: totalVisits,
      scheduled: scheduledVisits,
      completed: completedVisits,
      cancelled: cancelledVisits,
      conversionRate: Math.round(visitConversionRate * 100) / 100
    },
    proposals: {
      total: totalProposals,
      pending: pendingProposals,
      accepted: acceptedProposals,
      rejected: rejectedProposals,
      avgValue: Math.round(avgProposalValue)
    },
    tickets: {
      total: totalTickets,
      open: openTickets,
      pending: pendingTickets,
      closed: closedTickets
    },
    performance: {
      leadsThisMonth,
      leadsLastMonth,
      leadsGrowth: Math.round(leadsGrowth * 100) / 100,
      proposalsThisMonth,
      proposalsLastMonth,
      proposalsGrowth: Math.round(proposalsGrowth * 100) / 100
    }
  };
};

export default GetDashboardStatsService;
