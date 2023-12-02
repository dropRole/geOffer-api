import { Entity, Column, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import BaseEntity from 'src/base.entity';
import OfferorAddress from './types/offeror-address';
import OfferorReputation from './types/offeror-reputation';
import User from 'src/auth/user.entity';
import Request from 'src/requests/request.entity';

@Entity('offerors')
export default class Offeror extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'jsonb' })
  address: OfferorAddress;

  @Column({ type: 'varchar', length: 15 })
  telephone: string;

  @Column({ type: 'varchar', length: 254 })
  email: string;

  @Column({ type: 'text', nullable: true })
  businessHours: string;

  @Column({
    type: 'jsonb',
    default: {
      responsiveness: 10,
      compliance: 10,
      timeliness: 10,
    },
  })
  reputation: OfferorReputation;

  @OneToOne((_type) => User, {
    eager: true,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'username' })
  user: User;

  @OneToMany((_type) => Request, (request) => request.offeror)
  requests: Request[];
}
