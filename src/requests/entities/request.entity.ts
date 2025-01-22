import {
  Entity,
  Index,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import BaseEntity from 'src/common/entities/base.entity';
import Offeree from 'src/offerees/entities/offeree.entity';
import ServiceToRequest from './service-to-request.entity';

@Entity('requests')
@Index(['offeree'])
export default class Request extends BaseEntity {
  @Column({ type: 'text', nullable: true })
  note: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
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

  @OneToMany(
    (_type) => ServiceToRequest,
    (serviceToRequest) => serviceToRequest.request,
  )
  services: ServiceToRequest[];
}
