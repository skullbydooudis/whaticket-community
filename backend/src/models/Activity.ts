import {
  Table,
  Column,
  CreatedAt,
  Model,
  PrimaryKey,
  ForeignKey,
  BelongsTo,
  Default,
  DataType
} from "sequelize-typescript";

import User from "./User";

@Table
class Activity extends Model<Activity> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @Column(DataType.TEXT)
  type: string;

  @Column(DataType.TEXT)
  description: string;

  @Column(DataType.STRING)
  entityType: string;

  @Column(DataType.UUID)
  entityId: string;

  @Default({})
  @Column(DataType.JSONB)
  metadata: object;

  @ForeignKey(() => User)
  @Column
  userId: number;

  @BelongsTo(() => User)
  user: User;

  @CreatedAt
  createdAt: Date;
}

export default Activity;
