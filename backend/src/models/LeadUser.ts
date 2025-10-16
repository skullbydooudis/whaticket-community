import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  DataType,
  ForeignKey,
  BelongsTo
} from "sequelize-typescript";
import Lead from "./Lead";
import User from "./User";

@Table
class LeadUser extends Model<LeadUser> {
  @ForeignKey(() => Lead)
  @Column
  leadId: number;

  @ForeignKey(() => User)
  @Column
  userId: number;

  @Column(DataType.STRING)
  role: string;

  @Column(DataType.BOOLEAN)
  isPrimary: boolean;

  @Column(DataType.BOOLEAN)
  canEdit: boolean;

  @Column(DataType.BOOLEAN)
  receiveNotifications: boolean;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsTo(() => Lead)
  lead: Lead;

  @BelongsTo(() => User)
  user: User;
}

export default LeadUser;
