import AfterSales from "../../models/AfterSales";
import AfterSalesTimeline from "../../models/AfterSalesTimeline";
import Activity from "../../models/Activity";
import Lead from "../../models/Lead";
import Property from "../../models/Property";
import SendAutomatedMessage from "../WbotServices/SendAutomatedMessage";

interface Request {
  afterSalesId: number;
  status: string;
  notes?: string;
  userId: number;
}

const validStatuses = [
  "pending",
  "documentation",
  "contract_signing",
  "payment_processing",
  "deed_transfer",
  "key_delivery",
  "completed",
  "cancelled"
];

const statusMessages: Record<string, string> = {
  pending: "Processo iniciado e aguardando documentação",
  documentation: "Coletando documentação necessária",
  contract_signing: "Preparando e assinando contratos",
  payment_processing: "Processando pagamentos",
  deed_transfer: "Transferindo escritura do imóvel",
  key_delivery: "Preparando entrega das chaves",
  completed: "Processo concluído com sucesso!",
  cancelled: "Processo cancelado"
};

const UpdateAfterSalesStatusService = async ({
  afterSalesId,
  status,
  notes,
  userId
}: Request): Promise<AfterSales> => {
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status: ${status}`);
  }

  const afterSales = await AfterSales.findByPk(afterSalesId, {
    include: ["lead", "property", "store"]
  });

  if (!afterSales) {
    throw new Error("After-sales process not found");
  }

  const oldStatus = afterSales.status;

  if (oldStatus === status) {
    throw new Error("Status is already set to this value");
  }

  if (oldStatus === "completed" || oldStatus === "cancelled") {
    throw new Error("Cannot change status of completed or cancelled process");
  }

  afterSales.status = status;

  if (status === "completed" && !afterSales.actualDeliveryDate) {
    afterSales.actualDeliveryDate = new Date();
  }

  await afterSales.save();

  await AfterSalesTimeline.create({
    afterSalesId: afterSales.id,
    eventType: "status_change",
    eventTitle: `Status alterado para '${status}'`,
    eventDescription: notes || statusMessages[status],
    eventDate: new Date(),
    userId,
    metadata: {
      previousStatus: oldStatus,
      newStatus: status
    }
  });

  await Activity.create({
    type: "after_sales_status_changed",
    description: `Pós-venda ${afterSales.code} - ${oldStatus} → ${status}`,
    entityType: "after_sales",
    entityId: afterSales.id,
    userId,
    metadata: { oldStatus, newStatus: status }
  });

  if (afterSales.lead && afterSales.lead.phone) {
    try {
      const notificationMessages: Record<string, string> = {
        documentation: `Olá ${afterSales.lead.name}! 📄\n\nIniciamos a coleta de documentação para seu imóvel.\nEm breve entraremos em contato com a lista de documentos necessários.`,
        contract_signing: `Olá ${afterSales.lead.name}! 📝\n\nSeu contrato está pronto!\nVamos agendar a assinatura em breve.`,
        payment_processing: `Olá ${afterSales.lead.name}! 💰\n\nEstamos processando os pagamentos.\nManteremos você informado sobre o andamento.`,
        key_delivery: `Olá ${afterSales.lead.name}! 🔑\n\nEstamos preparando a entrega das chaves!\nEm breve agendaremos a data.`,
        completed: `Olá ${afterSales.lead.name}! 🎉\n\nParabéns! Processo concluído com sucesso!\n\nObrigado por confiar em nossos serviços.`
      };

      const message = notificationMessages[status];
      if (message) {
        await SendAutomatedMessage({
          contactId: afterSales.lead.contactId,
          body: message
        });
      }
    } catch (error) {
      console.error("Error sending status notification:", error);
    }
  }

  return afterSales;
};

export default UpdateAfterSalesStatusService;
