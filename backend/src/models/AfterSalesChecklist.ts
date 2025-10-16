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
class AfterSalesChecklist extends Model<AfterSalesChecklist> {
  @ForeignKey(() => AfterSales)
  @Column
  afterSalesId: number;

  @Column(DataType.ENUM("documentation", "financial", "legal", "property_preparation", "delivery", "other"))
  category: string;

  @Column(DataType.STRING)
  itemName: string;

  @Column(DataType.TEXT)
  description: string;

  @Column(DataType.BOOLEAN)
  isRequired: boolean;

  @Column(DataType.BOOLEAN)
  isCompleted: boolean;

  @ForeignKey(() => User)
  @Column
  completedBy: number;

  @Column(DataType.DATE)
  completedAt: Date;

  @Column(DataType.DATEONLY)
  dueDate: Date;

  @Column(DataType.TEXT)
  notes: string;

  @Column(DataType.INTEGER)
  order: number;

  @CreatedAt
  createdAt: Date;

  @BelongsTo(() => AfterSales)
  afterSales: AfterSales;

  @BelongsTo(() => User, "completedBy")
  completedByUser: User;
}

export default AfterSalesChecklist;
