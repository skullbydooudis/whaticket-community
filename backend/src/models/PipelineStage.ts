import {
  Table,
  Column,
  CreatedAt,
  Model,
  PrimaryKey,
  Default,
  DataType
} from "sequelize-typescript";

@Table
class PipelineStage extends Model<PipelineStage> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @Column(DataType.TEXT)
  name: string;

  @Default(0)
  @Column(DataType.INTEGER)
  order: number;

  @Default("#3f51b5")
  @Column(DataType.STRING)
  color: string;

  @Default(true)
  @Column(DataType.BOOLEAN)
  isActive: boolean;

  @CreatedAt
  createdAt: Date;
}

export default PipelineStage;
