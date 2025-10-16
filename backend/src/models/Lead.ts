import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  ForeignKey,
  BelongsTo,
  HasMany,
  Default,
  DataType
} from "sequelize-typescript";

import User from "./User";
import Contact from "./Contact";
import Task from "./Task";
import Proposal from "./Proposal";

@Table
class Lead extends Model<Lead> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @Column(DataType.TEXT)
  name: string;

  @Column(DataType.TEXT)
  email: string;

  @Column(DataType.TEXT)
  phone: string;

  @Default("website")
  @Column(DataType.STRING)
  source: string;

  @Default("new")
  @Column(DataType.STRING)
  status: string;

  @Default(0)
  @Column(DataType.INTEGER)
  score: number;

  @Column(DataType.DECIMAL(12, 2))
  budgetMin: number;

  @Column(DataType.DECIMAL(12, 2))
  budgetMax: number;

  @Column(DataType.STRING)
  propertyType: string;

  @Default([])
  @Column(DataType.JSONB)
  preferredLocations: string[];

  @Column(DataType.TEXT)
  notes: string;

  @Column(DataType.DATE)
  lastContactDate: Date;

  @Column(DataType.DATE)
  nextFollowUp: Date;

  @Column(DataType.UUID)
  stageId: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @ForeignKey(() => User)
  @Column
  assignedTo: number;

  @BelongsTo(() => User, "assignedTo")
  assignedUser: User;

  @ForeignKey(() => Contact)
  @Column
  contactId: number;

  @BelongsTo(() => Contact)
  contact: Contact;

  @HasMany(() => Task)
  tasks: Task[];

  @HasMany(() => Proposal)
  proposals: Proposal[];
}

export default Lead;
