import { Entity, Column, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import BaseEntity from '../../common/entities/base.entity';
import Request from '../../requests/entities/request.entity';
import { Incident } from '../../incidents/entities/incident.entity';

@Entity('reservations')
export default class Reservation extends BaseEntity {
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  reserved: string;

  @Column({ type: 'varchar', length: 15 })
  code: string;

  @OneToOne((_type) => Request, {
    eager: true,
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'idRequest' })
  request: Request;

  @OneToMany((_type) => Incident, (incident) => incident.reservation, {
    eager: true,
  })
  incidents: Incident[];
}
