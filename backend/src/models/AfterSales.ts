import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany
} from "sequelize-typescript";
import Proposal from "./Proposal";
import Lead from "./Lead";
import Property from "./Property";
import Store from "./Store";
import User from "./User";

@Table
class AfterSales extends Model<AfterSales> {
  @Column(DataType.STRING)
  code: string;

  @ForeignKey(() => Proposal)
  @Column
  proposalId: number;

  @ForeignKey(() => Lead)
  @Column
  leadId: number;

  @ForeignKey(() => Property)
  @Column
  propertyId: number;

  @ForeignKey(() => Store)
  @Column
  storeId: number;

  @ForeignKey(() => User)
  @Column
  assignedTo: number;

  @Column(DataType.ENUM(
    "pending", "documentation", "contract_signing", "payment_processing",
    "deed_transfer", "key_delivery", "completed", "cancelled"
  ))
  status: string;

  @Column(DataType.ENUM("sale", "rental"))
  type: string;

  @Column(DataType.DECIMAL(15, 2))
  saleValue: number;

  @Column(DataType.DECIMAL(15, 2))
  commissionValue: number;

  @Column(DataType.DATEONLY)
  contractDate: Date;

  @Column(DataType.DATEONLY)
  deliveryDate: Date;

  @Column(DataType.DATEONLY)
  actualDeliveryDate: Date;

  @Column(DataType.TEXT)
  notes: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsTo(() => Proposal)
  proposal: Proposal;

  @BelongsTo(() => Lead)
  lead: Lead;

  @BelongsTo(() => Property)
  property: Property;

  @BelongsTo(() => Store)
  store: Store;

  @BelongsTo(() => User, "assignedTo")
  assignedUser: User;
}

export default AfterSales;
