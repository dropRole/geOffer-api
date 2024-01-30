import { Entity, Column, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import BaseEntity from '../base.entity';
import User from '../auth/user.entity';
import Request from '../requests/request.entity';

@Entity('offerees')
export default class Offeree extends BaseEntity {
  @Column({ type: 'varchar', length: 35 })
  name: string;

  @Column({ type: 'varchar', length: 35 })
  surname: string;

  @Column({ type: 'varchar', length: 254 })
  email: string;

  @OneToOne((_type) => User, {
    eager: true,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'username' })
  user: User;

  @OneToMany((_type) => Request, (request) => request.offeree)
  requests: Request[];
}
