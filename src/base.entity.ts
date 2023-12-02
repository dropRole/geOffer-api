import { PrimaryGeneratedColumn } from 'typeorm';

export default abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
}
