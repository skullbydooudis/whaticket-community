import AfterSalesDocument from "../../models/AfterSalesDocument";
import AfterSalesTimeline from "../../models/AfterSalesTimeline";
import Activity from "../../models/Activity";
import SendAutomatedMessage from "../WbotServices/SendAutomatedMessage";

interface Request {
  documentId: number;
  rejectionReason: string;
  userId: number;
}

const RejectDocumentService = async ({
  documentId,
  rejectionReason,
  userId
}: Request): Promise<AfterSalesDocument> => {
  if (!rejectionReason || rejectionReason.trim().length < 10) {
    throw new Error("Rejection reason must be at least 10 characters");
  }

  const document = await AfterSalesDocument.findByPk(documentId, {
    include: [{ association: "afterSales", include: ["lead"] }]
  });

  if (!document) {
    throw new Error("Document not found");
  }

  if (document.status === "approved") {
    throw new Error("Cannot reject an approved document");
  }

  document.status = "rejected";
  document.verifiedBy = userId;
  document.verifiedAt = new Date();
  document.rejectionReason = rejectionReason;

  await document.save();

  await AfterSalesTimeline.create({
    afterSalesId: document.afterSalesId,
    eventType: "document_rejected",
    eventTitle: `Documento rejeitado: ${document.documentName}`,
    eventDescription: `Motivo: ${rejectionReason}`,
    eventDate: new Date(),
    userId,
    metadata: {
      documentId: document.id,
      documentType: document.documentType,
      rejectionReason
    }
  });

  await Activity.create({
    type: "after_sales_document_rejected",
    description: `Documento ${document.documentName} rejeitado`,
    entityType: "after_sales",
    entityId: document.afterSalesId,
    userId,
    metadata: {
      documentId: document.id,
      documentType: document.documentType,
      rejectionReason
    }
  });

  if (document.afterSales?.lead?.phone) {
    try {
      await SendAutomatedMessage({
        contactId: document.afterSales.lead.contactId,
        body: `Olá ${document.afterSales.lead.name}! 📄\n\nO documento "${document.documentName}" foi rejeitado.\n\n*Motivo:* ${rejectionReason}\n\nPor favor, envie uma nova versão do documento.`
      });
    } catch (error) {
      console.error("Error sending rejection notification:", error);
    }
  }

  return document;
};

export default RejectDocumentService;
