import AfterSalesDocument from "../../models/AfterSalesDocument";
import AfterSalesTimeline from "../../models/AfterSalesTimeline";
import AfterSalesChecklist from "../../models/AfterSalesChecklist";
import Activity from "../../models/Activity";
import AfterSales from "../../models/AfterSales";

interface Request {
  documentId: number;
  notes?: string;
  userId: number;
}

const ApproveDocumentService = async ({
  documentId,
  notes,
  userId
}: Request): Promise<AfterSalesDocument> => {
  const document = await AfterSalesDocument.findByPk(documentId, {
    include: [{ association: "afterSales", include: ["lead"] }]
  });

  if (!document) {
    throw new Error("Document not found");
  }

  if (document.status === "approved") {
    throw new Error("Document is already approved");
  }

  if (document.status === "rejected") {
    throw new Error("Cannot approve a rejected document. Upload a new one.");
  }

  document.status = "approved";
  document.verifiedBy = userId;
  document.verifiedAt = new Date();
  if (notes) {
    document.notes = notes;
  }

  await document.save();

  await AfterSalesTimeline.create({
    afterSalesId: document.afterSalesId,
    eventType: "document_approved",
    eventTitle: `Documento aprovado: ${document.documentName}`,
    eventDescription: notes || `Documento ${document.documentType} aprovado`,
    eventDate: new Date(),
    userId,
    metadata: {
      documentId: document.id,
      documentType: document.documentType
    }
  });

  await Activity.create({
    type: "after_sales_document_approved",
    description: `Documento ${document.documentName} aprovado`,
    entityType: "after_sales",
    entityId: document.afterSalesId,
    userId,
    metadata: {
      documentId: document.id,
      documentType: document.documentType
    }
  });

  const documentTypeToChecklistMap: Record<string, string> = {
    identity_document: "RG e CPF",
    proof_of_residence: "Comprovante de residência",
    proof_of_income: "Comprovante de renda",
    marriage_certificate: "Certidão de estado civil",
    purchase_contract: "Elaboração do contrato",
    deed: "Registro em cartório"
  };

  const checklistItemName = documentTypeToChecklistMap[document.documentType];
  if (checklistItemName) {
    const checklistItem = await AfterSalesChecklist.findOne({
      where: {
        afterSalesId: document.afterSalesId,
        itemName: { [Op.iLike]: `%${checklistItemName}%` },
        isCompleted: false
      }
    });

    if (checklistItem) {
      checklistItem.isCompleted = true;
      checklistItem.completedBy = userId;
      checklistItem.completedAt = new Date();
      await checklistItem.save();
    }
  }

  return document;
};

export default ApproveDocumentService;
