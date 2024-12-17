import BaseEntity from '../base.entity';
import { Check, Column, Entity, ManyToOne } from 'typeorm';
import { OfferorImageType } from './types';
import Offeror from './offeror.entity';

@Entity('offerorImages')
export default class OfferorImage extends BaseEntity {
  @Column({ type: 'text' })
  destination: string;

  @Column({ type: 'varchar', length: 9 })
  @Check("type IN('HIGHLIGHT', 'GALLERY')")
  type: OfferorImageType;

  @ManyToOne((_type) => Offeror, (offeror) => offeror.images)
  offeror: Offeror;
}
