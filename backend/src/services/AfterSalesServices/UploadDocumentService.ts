import AfterSales from "../../models/AfterSales";
import AfterSalesDocument from "../../models/AfterSalesDocument";
import AfterSalesTimeline from "../../models/AfterSalesTimeline";
import Activity from "../../models/Activity";

interface Request {
  afterSalesId: number;
  documentType: string;
  documentName: string;
  documentUrl: string;
  fileSize: number;
  mimeType: string;
  expiryDate?: Date;
  notes?: string;
  userId: number;
}

const validDocumentTypes = [
  "identity_document",
  "proof_of_residence",
  "proof_of_income",
  "marriage_certificate",
  "bank_statement",
  "tax_declaration",
  "purchase_contract",
  "deed",
  "registration",
  "payment_receipt",
  "commission_invoice",
  "other"
];

const UploadDocumentService = async (data: Request): Promise<AfterSalesDocument> => {
  if (!validDocumentTypes.includes(data.documentType)) {
    throw new Error(`Invalid document type: ${data.documentType}`);
  }

  const afterSales = await AfterSales.findByPk(data.afterSalesId, {
    include: ["lead"]
  });

  if (!afterSales) {
    throw new Error("After-sales process not found");
  }

  if (afterSales.status === "completed" || afterSales.status === "cancelled") {
    throw new Error("Cannot upload documents to completed or cancelled process");
  }

  const existingDocument = await AfterSalesDocument.findOne({
    where: {
      afterSalesId: data.afterSalesId,
      documentType: data.documentType,
      status: { [Op.in]: ["approved", "under_review"] }
    }
  });

  if (existingDocument && existingDocument.status === "approved") {
    throw new Error(`An approved ${data.documentType} already exists. Please reject it first if you need to replace it.`);
  }

  const document = await AfterSalesDocument.create({
    afterSalesId: data.afterSalesId,
    documentType: data.documentType,
    documentName: data.documentName,
    documentUrl: data.documentUrl,
    fileSize: data.fileSize,
    mimeType: data.mimeType,
    status: "received",
    uploadedBy: data.userId,
    uploadedAt: new Date(),
    expiryDate: data.expiryDate,
    notes: data.notes
  });

  await AfterSalesTimeline.create({
    afterSalesId: data.afterSalesId,
    eventType: "document_uploaded",
    eventTitle: `Documento enviado: ${data.documentName}`,
    eventDescription: `Tipo: ${data.documentType}`,
    eventDate: new Date(),
    userId: data.userId,
    metadata: {
      documentId: document.id,
      documentType: data.documentType,
      fileSize: data.fileSize
    }
  });

  await Activity.create({
    type: "after_sales_document_uploaded",
    description: `Documento ${data.documentName} enviado para ${afterSales.code}`,
    entityType: "after_sales",
    entityId: afterSales.id,
    userId: data.userId,
    metadata: {
      documentId: document.id,
      documentType: data.documentType
    }
  });

  return document;
};

export default UploadDocumentService;
