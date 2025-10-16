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
class Task extends Model<Task> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @Column(DataType.TEXT)
  title: string;

  @Column(DataType.TEXT)
  description: string;

  @Default("call")
  @Column(DataType.STRING)
  type: string;

  @Default("medium")
  @Column(DataType.STRING)
  priority: string;

  @Default("pending")
  @Column(DataType.STRING)
  status: string;

  @Column(DataType.DATE)
  dueDate: Date;

  @Column(DataType.DATE)
  completedAt: Date;

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

  @ForeignKey(() => User)
  @Column
  assignedTo: number;

  @BelongsTo(() => User, "assignedTo")
  assignedUser: User;

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

export default Task;
