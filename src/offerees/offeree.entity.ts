import { Entity, Column, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import BaseEntity from 'src/base.entity';
import User from 'src/auth/user.entity';
import Request from 'src/requests/request.entity';

@Entity('offerees')
export default class Offeree extends BaseEntity {
  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text' })
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
