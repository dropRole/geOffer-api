import { Entity, PrimaryColumn, Check, Column, OneToMany } from 'typeorm';
import { Exclude } from 'class-transformer';
import Incident from 'src/incidents/entities/incident.entity';
import Complaint from 'src/complaints/entities/complaint.entity';

type UserPrivilege = 'SUPERUSER' | 'OFFEREE' | 'OFFEROR';

@Entity('users')
export default class User {
  @PrimaryColumn({ type: 'varchar', length: 20, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 64 })
  @Exclude()
  password: string;

  @Check("privilege IN ('SUPERUSER', 'OFFEREE', 'OFFEROR')")
  @Column({ type: 'varchar', length: 9 })
  privilege: UserPrivilege;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created: string;

  @OneToMany((_type) => Incident, (incident) => incident.openedBy)
  incidents: Incident[];

  @OneToMany((_type) => Complaint, (complaint) => complaint.author)
  complaints: Complaint[];
}
