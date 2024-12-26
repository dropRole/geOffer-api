import BaseEntity from 'src/base.entity';
import { Check, Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { OfferorImageType } from './types';
import Offeror from './offeror.entity';
import Event from './event.entity';

@Entity('images')
export default class Image extends BaseEntity {
  @Column({ type: 'text' })
  destination: string;

  @Column({ type: 'varchar', length: 9 })
  @Check("type IN('HIGHLIGHT', 'GALLERY')")
  type: OfferorImageType;

  @ManyToOne((_type) => Offeror, (offeror) => offeror.images, {
    onDelete: 'RESTRICT',
    nullable: true,
  })
  @JoinColumn({ name: 'idOfferor' })
  offeror: Offeror;

  @ManyToOne((_type) => Event, (event) => event.images, {
    onDelete: 'RESTRICT',
    nullable: true,
  })
  @JoinColumn({ name: 'idEvent' })
  event: Event;
}
