import Lead from "../../models/Lead";
import Contact from "../../models/Contact";
import User from "../../models/User";
import SendAutomatedMessage from "./SendAutomatedMessage";

interface Request {
  leadId: number;
}

const SendNewLeadNotification = async ({ leadId }: Request): Promise<void> => {
  const lead = await Lead.findByPk(leadId, {
    include: [
      { model: Contact, as: "contact" },
      { model: User, as: "assignedUser" }
    ]
  });

  if (!lead || !lead.contact) {
    throw new Error("Lead or contact not found");
  }

  const contact = lead.contact;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  };

  let budgetText = "";
  if (lead.budgetMin && lead.budgetMax) {
    budgetText = `\n💰 Orçamento: ${formatCurrency(lead.budgetMin)} - ${formatCurrency(lead.budgetMax)}`;
  }

  let propertyTypeText = "";
  if (lead.propertyType) {
    const types: Record<string, string> = {
      apartment: "Apartamento",
      house: "Casa",
      condo: "Condomínio",
      commercial: "Comercial",
      land: "Terreno"
    };
    propertyTypeText = `\n🏠 Tipo: ${types[lead.propertyType] || lead.propertyType}`;
  }

  const message = `Olá ${contact.name}! 👋

Obrigado pelo seu interesse! Recebemos sua solicitação e em breve entraremos em contato.
${budgetText}${propertyTypeText}

${lead.assignedUser ? `Seu consultor será: ${lead.assignedUser.name}` : ""}

Estamos à disposição para ajudá-lo a encontrar o imóvel ideal!`;

  await SendAutomatedMessage({
    contactId: contact.id,
    body: message
  });
};

export default SendNewLeadNotification;
