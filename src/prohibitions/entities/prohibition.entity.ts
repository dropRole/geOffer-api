import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import BaseEntity from 'src/common/entities/base.entity';
import Incident from 'src/incidents/entities/incident.entity';

@Entity('prohibitions')
export default class Prohibition extends BaseEntity {
  @Column({ type: 'timestamp' })
  beginning: string;

  @Column({ type: 'timestamp' })
  termination: string;

  @OneToOne((_type) => Incident, {
    eager: true,
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'idIncident' })
  incident: Incident;
}
