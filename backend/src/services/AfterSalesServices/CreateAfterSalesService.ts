import AfterSales from "../../models/AfterSales";
import AfterSalesTimeline from "../../models/AfterSalesTimeline";
import AfterSalesChecklist from "../../models/AfterSalesChecklist";
import Activity from "../../models/Activity";
import Proposal from "../../models/Proposal";
import Property from "../../models/Property";

interface Request {
  proposalId: number;
  storeId: number;
  assignedTo: number;
  type: "sale" | "rental";
  saleValue: number;
  commissionValue?: number;
  contractDate?: Date;
  deliveryDate?: Date;
  notes?: string;
  userId: number;
}

const CreateAfterSalesService = async (data: Request): Promise<AfterSales> => {
  const proposal = await Proposal.findByPk(data.proposalId, {
    include: ["lead", "property"]
  });

  if (!proposal) {
    throw new Error("Proposal not found");
  }

  if (proposal.status !== "accepted") {
    throw new Error("Only accepted proposals can create after-sales process");
  }

  const afterSales = await AfterSales.create({
    proposalId: data.proposalId,
    leadId: proposal.leadId,
    propertyId: proposal.propertyId,
    storeId: data.storeId,
    assignedTo: data.assignedTo,
    status: "pending",
    type: data.type,
    saleValue: data.saleValue,
    commissionValue: data.commissionValue,
    contractDate: data.contractDate,
    deliveryDate: data.deliveryDate,
    notes: data.notes
  });

  await AfterSalesTimeline.create({
    afterSalesId: afterSales.id,
    eventType: "status_change",
    eventTitle: "Processo de pós-venda iniciado",
    eventDescription: `Processo criado para ${data.type === "sale" ? "venda" : "locação"}`,
    eventDate: new Date(),
    userId: data.userId,
    metadata: { initialStatus: "pending" }
  });

  const defaultChecklist = await getDefaultChecklist(data.type);
  for (const item of defaultChecklist) {
    await AfterSalesChecklist.create({
      afterSalesId: afterSales.id,
      ...item
    });
  }

  await Activity.create({
    type: "after_sales_created",
    description: `Pós-venda criado para ${proposal.lead?.name}`,
    entityType: "after_sales",
    entityId: afterSales.id,
    userId: data.userId,
    metadata: {
      proposalId: data.proposalId,
      type: data.type,
      saleValue: data.saleValue
    }
  });

  return afterSales;
};

const getDefaultChecklist = async (type: string) => {
  const saleChecklist = [
    {
      category: "documentation",
      itemName: "RG e CPF do comprador",
      description: "Documentos de identidade e CPF atualizados",
      isRequired: true,
      isCompleted: false,
      order: 1
    },
    {
      category: "documentation",
      itemName: "Comprovante de residência",
      description: "Conta de luz, água ou telefone recente",
      isRequired: true,
      isCompleted: false,
      order: 2
    },
    {
      category: "documentation",
      itemName: "Comprovante de renda",
      description: "Holerite, imposto de renda ou extrato bancário",
      isRequired: true,
      isCompleted: false,
      order: 3
    },
    {
      category: "documentation",
      itemName: "Certidão de estado civil",
      description: "Certidão de nascimento, casamento ou divórcio",
      isRequired: true,
      isCompleted: false,
      order: 4
    },
    {
      category: "financial",
      itemName: "Sinal de entrada",
      description: "Receber valor de entrada acordado",
      isRequired: true,
      isCompleted: false,
      order: 5
    },
    {
      category: "financial",
      itemName: "Aprovação de crédito",
      description: "Se houver financiamento bancário",
      isRequired: false,
      isCompleted: false,
      order: 6
    },
    {
      category: "legal",
      itemName: "Elaboração do contrato",
      description: "Contrato de compra e venda elaborado",
      isRequired: true,
      isCompleted: false,
      order: 7
    },
    {
      category: "legal",
      itemName: "Assinatura do contrato",
      description: "Assinatura de todas as partes",
      isRequired: true,
      isCompleted: false,
      order: 8
    },
    {
      category: "legal",
      itemName: "Registro em cartório",
      description: "Registro da escritura em cartório",
      isRequired: true,
      isCompleted: false,
      order: 9
    },
    {
      category: "property_preparation",
      itemName: "Vistoria do imóvel",
      description: "Vistoria técnica e fotográfica",
      isRequired: true,
      isCompleted: false,
      order: 10
    },
    {
      category: "property_preparation",
      itemName: "Limpeza do imóvel",
      description: "Limpeza completa antes da entrega",
      isRequired: false,
      isCompleted: false,
      order: 11
    },
    {
      category: "delivery",
      itemName: "Entrega das chaves",
      description: "Entrega oficial das chaves ao comprador",
      isRequired: true,
      isCompleted: false,
      order: 12
    },
    {
      category: "delivery",
      itemName: "Transferência de contas",
      description: "Transferir contas de água, luz, gás, etc.",
      isRequired: true,
      isCompleted: false,
      order: 13
    }
  ];

  const rentalChecklist = [
    {
      category: "documentation",
      itemName: "RG e CPF do locatário",
      description: "Documentos de identidade e CPF atualizados",
      isRequired: true,
      isCompleted: false,
      order: 1
    },
    {
      category: "documentation",
      itemName: "Comprovante de renda",
      description: "Holerite ou declaração de imposto de renda",
      isRequired: true,
      isCompleted: false,
      order: 2
    },
    {
      category: "documentation",
      itemName: "Referências pessoais",
      description: "Contato de referências comerciais",
      isRequired: true,
      isCompleted: false,
      order: 3
    },
    {
      category: "financial",
      itemName: "Caução/Depósito",
      description: "Receber caução ou primeiro mês de aluguel",
      isRequired: true,
      isCompleted: false,
      order: 4
    },
    {
      category: "legal",
      itemName: "Elaboração do contrato",
      description: "Contrato de locação elaborado",
      isRequired: true,
      isCompleted: false,
      order: 5
    },
    {
      category: "legal",
      itemName: "Assinatura do contrato",
      description: "Assinatura do locatário e fiadores",
      isRequired: true,
      isCompleted: false,
      order: 6
    },
    {
      category: "property_preparation",
      itemName: "Vistoria de entrada",
      description: "Vistoria completa com fotos",
      isRequired: true,
      isCompleted: false,
      order: 7
    },
    {
      category: "delivery",
      itemName: "Entrega das chaves",
      description: "Entrega das chaves ao locatário",
      isRequired: true,
      isCompleted: false,
      order: 8
    }
  ];

  return type === "sale" ? saleChecklist : rentalChecklist;
};

export default CreateAfterSalesService;
