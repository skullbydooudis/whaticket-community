import {
  Table,
  Column,
  CreatedAt,
  Model,
  DataType,
  ForeignKey,
  BelongsTo
} from "sequelize-typescript";
import User from "./User";
import Store from "./Store";

@Table
class UserStore extends Model<UserStore> {
  @ForeignKey(() => User)
  @Column
  userId: number;

  @ForeignKey(() => Store)
  @Column
  storeId: number;

  @Column(DataType.BOOLEAN)
  isPrimary: boolean;

  @Column(DataType.JSONB)
  permissions: object;

  @CreatedAt
  createdAt: Date;

  @BelongsTo(() => User)
  user: User;

  @BelongsTo(() => Store)
  store: Store;
}

export default UserStore;
