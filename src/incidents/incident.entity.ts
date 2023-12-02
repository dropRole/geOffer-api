import {
  Entity,
  Index,
  Column,
  Check,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import BaseEntity from 'src/base.entity';
import IncidentStatus from './types/incident-status';
import User from 'src/auth/user.entity';
import Reservation from 'src/reservations/reservation.entity';
import Complaint from 'src/complaints/complaint.entity';

@Entity('incidents')
@Index(['openedBy', 'reservation'])
export default class Incident extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  title: string;

  @Check("status IN('PENDING', 'RESOLVED', 'REJECTED')")
  @Column({ type: 'varchar', length: 8 })
  status: IncidentStatus;

  @Column({ type: 'timestamp', default: 'NOW' })
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
