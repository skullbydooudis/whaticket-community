import {
  Table,
  Column,
  CreatedAt,
  Model,
  DataType,
  ForeignKey,
  BelongsTo
} from "sequelize-typescript";
import AfterSales from "./AfterSales";
import User from "./User";

@Table
class AfterSalesDocument extends Model<AfterSalesDocument> {
  @ForeignKey(() => AfterSales)
  @Column
  afterSalesId: number;

  @Column(DataType.ENUM(
    "identity_document", "proof_of_residence", "proof_of_income",
    "marriage_certificate", "bank_statement", "tax_declaration",
    "purchase_contract", "deed", "registration",
    "payment_receipt", "commission_invoice", "other"
  ))
  documentType: string;

  @Column(DataType.STRING)
  documentName: string;

  @Column(DataType.TEXT)
  documentUrl: string;

  @Column(DataType.BIGINT)
  fileSize: number;

  @Column(DataType.STRING)
  mimeType: string;

  @Column(DataType.ENUM("pending", "received", "under_review", "approved", "rejected", "expired"))
  status: string;

  @ForeignKey(() => User)
  @Column
  uploadedBy: number;

  @Column(DataType.DATE)
  uploadedAt: Date;

  @ForeignKey(() => User)
  @Column
  verifiedBy: number;

  @Column(DataType.DATE)
  verifiedAt: Date;

  @Column(DataType.TEXT)
  rejectionReason: string;

  @Column(DataType.DATEONLY)
  expiryDate: Date;

  @Column(DataType.TEXT)
  notes: string;

  @CreatedAt
  createdAt: Date;

  @BelongsTo(() => AfterSales)
  afterSales: AfterSales;

  @BelongsTo(() => User, "uploadedBy")
  uploader: User;

  @BelongsTo(() => User, "verifiedBy")
  verifier: User;
}

export default AfterSalesDocument;
