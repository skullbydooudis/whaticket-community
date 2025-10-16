import Proposal from "../../models/Proposal";
import Contact from "../../models/Contact";
import Property from "../../models/Property";
import Lead from "../../models/Lead";
import SendAutomatedMessage from "./SendAutomatedMessage";

interface Request {
  proposalId: number;
}

const SendProposalNotification = async ({ proposalId }: Request): Promise<void> => {
  const proposal = await Proposal.findByPk(proposalId, {
    include: [
      {
        model: Lead,
        as: "lead",
        include: [{ model: Contact, as: "contact" }]
      },
      { model: Property, as: "property" }
    ]
  });

  if (!proposal || !proposal.lead || !proposal.lead.contact || !proposal.property) {
    throw new Error("Proposal, lead, contact or property not found");
  }

  const contact = proposal.lead.contact;
  const property = proposal.property;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  };

  const message = `Olá ${contact.name}! 🎉

Temos o prazer de enviar uma proposta para o imóvel:

🏠 *${property.title}*
📍 ${property.address}, ${property.city}

💰 *Valor proposto:* ${formatCurrency(proposal.proposedValue)}
${proposal.downPayment ? `💳 *Entrada:* ${formatCurrency(proposal.downPayment)}` : ""}
${proposal.installments ? `📊 *Parcelamento:* ${proposal.installments}x` : ""}

${proposal.notes ? `\n📝 *Observações:*\n${proposal.notes}` : ""}

Estamos à disposição para negociar e esclarecer qualquer dúvida!`;

  await SendAutomatedMessage({
    contactId: contact.id,
    body: message
  });
};

export default SendProposalNotification;
