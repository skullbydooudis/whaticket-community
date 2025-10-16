import Proposal from "../../models/Proposal";
import Property from "../../models/Property";
import Lead from "../../models/Lead";
import Contact from "../../models/Contact";
import Activity from "../../models/Activity";
import SendProposalNotification from "../WbotServices/SendProposalNotification";

interface Request {
  leadId: number;
  propertyId: number;
  proposedValue: number;
  downPayment?: number;
  installments?: number;
  installmentValue?: number;
  notes?: string;
  template?: string;
  userId: number;
}

interface ProposalTemplate {
  title: string;
  sections: {
    title: string;
    content: string;
  }[];
}

const GenerateProposalService = async (data: Request): Promise<Proposal> => {
  const property = await Property.findByPk(data.propertyId);
  if (!property) {
    throw new Error("Property not found");
  }

  const lead = await Lead.findByPk(data.leadId, {
    include: [{ model: Contact, as: "contact" }]
  });
  if (!lead) {
    throw new Error("Lead not found");
  }

  let installmentValue = data.installmentValue;
  if (!installmentValue && data.downPayment && data.installments) {
    const remaining = data.proposedValue - data.downPayment;
    installmentValue = remaining / data.installments;
  }

  const proposal = await Proposal.create({
    leadId: data.leadId,
    propertyId: data.propertyId,
    proposedValue: data.proposedValue,
    downPayment: data.downPayment,
    installments: data.installments,
    installmentValue: installmentValue,
    notes: data.notes,
    status: "draft"
  });

  const template = getProposalTemplate(data.template || "standard", {
    property,
    lead,
    proposal
  });

  proposal.template = template;
  await proposal.save();

  await Activity.create({
    type: "proposal_created",
    description: `Proposta gerada para ${property.title}`,
    entityType: "proposal",
    entityId: proposal.id,
    userId: data.userId,
    metadata: {
      propertyId: data.propertyId,
      leadId: data.leadId,
      proposedValue: data.proposedValue
    }
  });

  return proposal;
};

const getProposalTemplate = (
  templateType: string,
  context: { property: Property; lead: Lead; proposal: Proposal }
): any => {
  const { property, lead, proposal } = context;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  };

  const templates: Record<string, ProposalTemplate> = {
    standard: {
      title: `Proposta Comercial - ${property.title}`,
      sections: [
        {
          title: "Apresentação",
          content: `Prezado(a) ${lead.name},\n\nÉ com grande satisfação que apresentamos esta proposta comercial para aquisição do imóvel localizado em ${property.address}, ${property.city}.`
        },
        {
          title: "Detalhes do Imóvel",
          content: `Tipo: ${property.type}\nÁrea: ${property.area}m²\nQuartos: ${property.bedrooms}\nBanheiros: ${property.bathrooms}\nVagas de garagem: ${property.parkingSpaces}\n\nCaracterísticas:\n${property.features?.join("\n") || "N/A"}`
        },
        {
          title: "Condições Comerciais",
          content: `Valor Total: ${formatCurrency(proposal.proposedValue)}\n${
            proposal.downPayment
              ? `Entrada: ${formatCurrency(proposal.downPayment)}\n`
              : ""
          }${
            proposal.installments && proposal.installmentValue
              ? `Parcelamento: ${proposal.installments}x de ${formatCurrency(proposal.installmentValue)}`
              : ""
          }`
        },
        {
          title: "Observações",
          content: proposal.notes || "Sem observações adicionais."
        },
        {
          title: "Validade",
          content: "Esta proposta tem validade de 15 dias corridos a partir da data de emissão."
        }
      ]
    },
    premium: {
      title: `Proposta Exclusiva - ${property.title}`,
      sections: [
        {
          title: "Apresentação Executiva",
          content: `Caro(a) ${lead.name},\n\nApresentamos uma oportunidade exclusiva de aquisição de um imóvel premium que atende perfeitamente ao seu perfil e necessidades.`
        },
        {
          title: "Visão Geral do Imóvel",
          content: `${property.description}\n\nEspecificações Técnicas:\n- Tipo: ${property.type}\n- Área Total: ${property.area}m²\n- Suítes: ${property.bedrooms}\n- Banheiros: ${property.bathrooms}\n- Vagas Cobertas: ${property.parkingSpaces}`
        },
        {
          title: "Diferenciais e Comodidades",
          content: property.features?.join("\n• ") || "Consulte para mais informações"
        },
        {
          title: "Investimento",
          content: `Valor do Investimento: ${formatCurrency(proposal.proposedValue)}\n\nFormas de Pagamento:\n${
            proposal.downPayment
              ? `- Sinal: ${formatCurrency(proposal.downPayment)}\n`
              : ""
          }${
            proposal.installments && proposal.installmentValue
              ? `- Parcelamento facilitado em ${proposal.installments} vezes de ${formatCurrency(proposal.installmentValue)}`
              : "- Condições especiais disponíveis"
          }`
        },
        {
          title: "Próximos Passos",
          content: "1. Análise e aprovação da proposta\n2. Documentação e vistoria\n3. Formalização do contrato\n4. Entrega das chaves"
        },
        {
          title: "Informações Adicionais",
          content: proposal.notes || "Estamos à disposição para esclarecer quaisquer dúvidas."
        }
      ]
    }
  };

  return templates[templateType] || templates.standard;
};

export default GenerateProposalService;
