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
class AfterSalesTimeline extends Model<AfterSalesTimeline> {
  @ForeignKey(() => AfterSales)
  @Column
  afterSalesId: number;

  @Column(DataType.ENUM(
    "status_change", "document_uploaded", "document_approved", "document_rejected",
    "payment_received", "contract_signed", "meeting_scheduled",
    "note_added", "assignment_changed", "other"
  ))
  eventType: string;

  @Column(DataType.STRING)
  eventTitle: string;

  @Column(DataType.TEXT)
  eventDescription: string;

  @Column(DataType.DATE)
  eventDate: Date;

  @ForeignKey(() => User)
  @Column
  userId: number;

  @Column(DataType.JSONB)
  metadata: object;

  @CreatedAt
  createdAt: Date;

  @BelongsTo(() => AfterSales)
  afterSales: AfterSales;

  @BelongsTo(() => User)
  user: User;
}

export default AfterSalesTimeline;
