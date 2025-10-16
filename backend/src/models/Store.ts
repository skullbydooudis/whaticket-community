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
import User from "./User";

@Table
class Store extends Model<Store> {
  @Column(DataType.STRING)
  name: string;

  @Column(DataType.STRING)
  code: string;

  @Column(DataType.ENUM("headquarters", "branch", "franchise"))
  type: string;

  @Column(DataType.STRING)
  cnpj: string;

  @Column(DataType.STRING)
  email: string;

  @Column(DataType.STRING)
  phone: string;

  @Column(DataType.TEXT)
  address: string;

  @Column(DataType.STRING)
  city: string;

  @Column(DataType.STRING)
  state: string;

  @Column(DataType.STRING)
  zipCode: string;

  @ForeignKey(() => User)
  @Column
  managerId: number;

  @ForeignKey(() => Store)
  @Column
  parentStoreId: number;

  @Column(DataType.BOOLEAN)
  isActive: boolean;

  @Column(DataType.JSONB)
  settings: object;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsTo(() => User, "managerId")
  manager: User;

  @BelongsTo(() => Store, "parentStoreId")
  parentStore: Store;

  @HasMany(() => Store, "parentStoreId")
  branches: Store[];
}

export default Store;
