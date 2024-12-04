import BaseEntity from 'src/base.entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import Offeror from './offeror.entity';

@Entity('offerorEvents')
export class OfferorEvent extends BaseEntity {
  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'timestamp' })
  beginning: string;

  @Column({ type: 'timestamp' })
  conclusion: string;

  @Column({ type: 'text' })
  image: string;

  @ManyToOne((_type) => Offeror, (offeror) => offeror.events)
  offeror: Offeror;
}
