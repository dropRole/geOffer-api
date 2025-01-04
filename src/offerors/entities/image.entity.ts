import BaseEntity from 'src/common/entities/base.entity';
import { Check, Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import Offeror from './offeror.entity';
import Event from './event.entity';

type ImageType = 'HIGHLIGHT' | 'GALLERY';

@Entity('images')
export default class Image extends BaseEntity {
  @Column({ type: 'text' })
  destination: string;

  @Column({ type: 'varchar', length: 9 })
  @Check("type IN('HIGHLIGHT', 'GALLERY')")
  type: ImageType;

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
