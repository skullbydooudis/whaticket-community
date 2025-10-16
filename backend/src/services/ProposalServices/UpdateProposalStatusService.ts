import Proposal from "../../models/Proposal";
import Property from "../../models/Property";
import Lead from "../../models/Lead";
import Activity from "../../models/Activity";

interface Request {
  proposalId: number;
  status: string;
  userId: number;
  rejectionReason?: string;
}

const UpdateProposalStatusService = async (data: Request): Promise<Proposal> => {
  const proposal = await Proposal.findByPk(data.proposalId, {
    include: [
      { model: Property, as: "property" },
      { model: Lead, as: "lead" }
    ]
  });

  if (!proposal) {
    throw new Error("Proposal not found");
  }

  const oldStatus = proposal.status;
  proposal.status = data.status;

  if (data.status === "accepted") {
    proposal.acceptedAt = new Date();

    if (proposal.property) {
      proposal.property.status = "reserved";
      await proposal.property.save();
    }

    if (proposal.lead) {
      proposal.lead.status = "converted";
      await proposal.lead.save();
    }
  }

  if (data.status === "rejected") {
    proposal.rejectedAt = new Date();
    proposal.rejectionReason = data.rejectionReason;
  }

  await proposal.save();

  const activityDescriptions: Record<string, string> = {
    accepted: "Proposta aceita pelo cliente",
    rejected: "Proposta rejeitada pelo cliente",
    viewed: "Proposta visualizada pelo cliente",
    negotiating: "Proposta em negociação"
  };

  await Activity.create({
    type: "proposal_status_changed",
    description: activityDescriptions[data.status] || `Status alterado para ${data.status}`,
    entityType: "proposal",
    entityId: proposal.id,
    userId: data.userId,
    metadata: {
      oldStatus,
      newStatus: data.status,
      rejectionReason: data.rejectionReason
    }
  });

  return proposal;
};

export default UpdateProposalStatusService;
