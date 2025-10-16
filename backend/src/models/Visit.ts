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

import Property from "./Property";
import Contact from "./Contact";
import User from "./User";

@Table
class Visit extends Model<Visit> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

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
  userId: number;

  @BelongsTo(() => User)
  user: User;

  @Column(DataType.DATE)
  scheduledDate: Date;

  @Default("scheduled")
  @Column(DataType.STRING)
  status: string;

  @Column(DataType.TEXT)
  notes: string;

  @Column(DataType.TEXT)
  feedback: string;

  @Default(false)
  @Column(DataType.BOOLEAN)
  interested: boolean;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default Visit;
