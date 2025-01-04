import {
  Entity,
  Index,
  Column,
  OneToOne,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import BaseEntity from 'src/common/entities/base.entity';
import User from 'src/auth/entities/user.entity';
import Incident from 'src/incidents/entities/incident.entity';

@Entity('complaints')
@Index(['author', 'incident'])
export default class Complaint extends BaseEntity {
  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'timestamp', default: 'NOW' })
  written: string;

  @Column({ type: 'timestamp', nullable: true })
  edited: string;

  @OneToOne((_type) => Complaint, {
    createForeignKeyConstraints: false,
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'idCounteredComplaint' })
  counteredComplaint: Complaint;

  @ManyToOne((_type) => User, (author) => author.complaints, {
    eager: true,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'author' })
  author: User;

  @ManyToOne((_type) => Incident, (incident) => incident.complaints, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'idIncident' })
  incident: Incident;
}
