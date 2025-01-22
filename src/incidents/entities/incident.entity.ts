import {
  Entity,
  Index,
  Column,
  Check,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import BaseEntity from '../../common/entities/base.entity';
import { User } from '../../auth/entities/user.entity';
import Reservation from '../../reservations/entities/reservation.entity';
import Complaint from '../../complaints/entities/complaint.entity';

export type IncidentStatus = 'PENDING' | 'RESOLVED' | 'REJECTED';

@Entity('incidents')
@Index(['openedBy', 'reservation'])
export class Incident extends BaseEntity {
  @Column({ type: 'text' })
  title: string;

  @Check("status IN('PENDING', 'RESOLVED', 'REJECTED')")
  @Column({ type: 'varchar', length: 8, default: 'PENDING' })
  status: IncidentStatus;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  opened: string;

  @Column({ type: 'text', nullable: true })
  conclusion: string;

  @ManyToOne((_type) => User, (openedBy) => openedBy.incidents, {
    eager: true,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'openedBy' })
  openedBy: User;

  @ManyToOne((_type) => Reservation, (reservation) => reservation.incidents, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'idReservation' })
  reservation: Reservation;

  @OneToMany((_type) => Complaint, (complaint) => complaint.incident, {
    eager: true,
  })
  complaints: Complaint[];
}
