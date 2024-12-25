import {
  Entity,
  Index,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import BaseEntity from 'src/base.entity';
import Offeree from 'src/offerees/offeree.entity';
import Offeror from 'src/offerors/offeror.entity';
import ServiceToRequest from './service-to-request';

@Entity('requests')
@Index(['offeree', 'offeror'])
export default class Request extends BaseEntity {
  @Column({ type: 'text', nullable: true })
  note: string;

  @Column({ type: 'timestamp', default: 'NOW' })
  requestedAt: string;

  @Column({ type: 'timestamp', nullable: true })
  requestedFor: string;

  @Column({ type: 'timestamp', nullable: true })
  assessment: string;

  @ManyToOne((_type) => Offeree, (offeree) => offeree.requests, {
    eager: true,
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'idOfferee' })
  offeree: Offeree;

  @ManyToOne((_type) => Offeror, (offeror) => offeror.requests, {
    eager: true,
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'idOfferor' })
  offeror: Offeror;

  @OneToMany(
    (_type) => ServiceToRequest,
    (serviceToRequest) => serviceToRequest.request,
  )
  servicesProducts: ServiceToRequest[];
}
