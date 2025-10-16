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
import Visit from "./Visit";

@Table
class Property extends Model<Property> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @Column(DataType.TEXT)
  title: string;

  @Column(DataType.TEXT)
  description: string;

  @Default("apartment")
  @Column(DataType.STRING)
  type: string;

  @Default("available")
  @Column(DataType.STRING)
  status: string;

  @Default(0)
  @Column(DataType.DECIMAL(12, 2))
  price: number;

  @Column(DataType.DECIMAL(10, 2))
  area: number;

  @Default(0)
  @Column(DataType.INTEGER)
  bedrooms: number;

  @Default(0)
  @Column(DataType.INTEGER)
  bathrooms: number;

  @Default(0)
  @Column(DataType.INTEGER)
  parkingSpaces: number;

  @Column(DataType.TEXT)
  address: string;

  @Column(DataType.STRING)
  city: string;

  @Column(DataType.STRING)
  state: string;

  @Column(DataType.STRING)
  zipCode: string;

  @Default([])
  @Column(DataType.JSONB)
  images: string[];

  @Default([])
  @Column(DataType.JSONB)
  features: string[];

  @Column(DataType.STRING)
  publicUrl: string;

  @Default(true)
  @Column(DataType.BOOLEAN)
  isActive: boolean;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @ForeignKey(() => User)
  @Column
  userId: number;

  @BelongsTo(() => User)
  user: User;

  @HasMany(() => Visit)
  visits: Visit[];
}

export default Property;
