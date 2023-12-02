import { Entity, Column, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import BaseEntity from 'src/base.entity';
import Request from 'src/requests/request.entity';
import Incident from 'src/incidents/incident.entity';

@Entity('reservations')
export default class Reservation extends BaseEntity {
  @Column({ type: 'timestamp', default: 'NOW' })
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
