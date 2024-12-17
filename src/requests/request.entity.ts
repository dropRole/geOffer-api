import { Entity, Index, Column, ManyToOne, JoinColumn } from 'typeorm';
import BaseEntity from '../base.entity';
import Offeree from '../offerees/offeree.entity';
import Offeror from '../offerors/offeror.entity';
import { OfferorService } from '../offerors/types';

@Entity('requests')
@Index(['offeree', 'offeror'])
export default class Request extends BaseEntity {
  @Column({ type: 'text' })
  service: Pick<OfferorService['service'], 'name'>;

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
}
