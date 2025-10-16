import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  ForeignKey,
  BelongsTo,
  Default,
  DataType
} from "sequelize-typescript";

import Lead from "./Lead";
import Property from "./Property";
import Contact from "./Contact";
import User from "./User";

@Table
class Proposal extends Model<Proposal> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @Column({ type: DataType.TEXT, unique: true })
  proposalNumber: string;

  @ForeignKey(() => Lead)
  @Column(DataType.UUID)
  leadId: string;

  @BelongsTo(() => Lead)
  lead: Lead;

  @ForeignKey(() => Property)
  @Column(DataType.UUID)
  propertyId: string;

  @BelongsTo(() => Property)
  property: Property;

  @ForeignKey(() => Contact)
  @Column
  contactId: number;

  @BelongsTo(() => Contact)
  contact: Contact;

  @Default("sale")
  @Column(DataType.STRING)
  type: string;

  @Column(DataType.DECIMAL(12, 2))
  proposedValue: number;

  @Default("cash")
  @Column(DataType.STRING)
  paymentMethod: string;

  @Column(DataType.DECIMAL(12, 2))
  downPayment: number;

  @Column(DataType.INTEGER)
  installments: number;

  @Default("draft")
  @Column(DataType.STRING)
  status: string;

  @Column(DataType.DATEONLY)
  validUntil: Date;

  @Column(DataType.TEXT)
  notes: string;

  @Column(DataType.TEXT)
  termsConditions: string;

  @Column(DataType.DATE)
  sentAt: Date;

  @Column(DataType.DATE)
  viewedAt: Date;

  @Column(DataType.DATE)
  respondedAt: Date;

  @ForeignKey(() => User)
  @Column
  createdBy: number;

  @BelongsTo(() => User, "createdBy")
  creator: User;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default Proposal;
