import Proposal from "../../models/Proposal";
import Activity from "../../models/Activity";
import SendProposalNotification from "../WbotServices/SendProposalNotification";

interface Request {
  proposalId: number;
  userId: number;
  sendNotification?: boolean;
}

const SendProposalService = async ({
  proposalId,
  userId,
  sendNotification = true
}: Request): Promise<Proposal> => {
  const proposal = await Proposal.findByPk(proposalId);

  if (!proposal) {
    throw new Error("Proposal not found");
  }

  if (proposal.status !== "draft") {
    throw new Error("Only draft proposals can be sent");
  }

  proposal.status = "sent";
  proposal.sentAt = new Date();
  await proposal.save();

  await Activity.create({
    type: "proposal_sent",
    description: "Proposta enviada ao cliente",
    entityType: "proposal",
    entityId: proposal.id,
    userId,
    metadata: { sentAt: new Date() }
  });

  if (sendNotification) {
    try {
      await SendProposalNotification({ proposalId });
    } catch (error) {
      console.error("Error sending proposal notification:", error);
    }
  }

  return proposal;
};

export default SendProposalService;
