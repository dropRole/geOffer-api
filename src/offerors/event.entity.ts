import BaseEntity from 'src/base.entity';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import Offeror from './offeror.entity';
import Image from './image.entity';
import ServiceToOfferor from './service-to-offeror.entity';

@Entity('events')
export default class Event extends BaseEntity {
  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text' })
  detailed: string;

  @Column({ type: 'timestamp' })
  beginning: string;

  @Column({ type: 'timestamp', nullable: true })
  conclusion: string;

  @ManyToOne((_type) => Offeror, (offeror) => offeror.events)
  offeror: Offeror;

  @OneToMany((_type) => Image, (image) => image.event, { eager: true })
  images: Image[];

  @OneToMany(
    (_type) => ServiceToOfferor,
    (offerorServiceProduct) => offerorServiceProduct.service,
    {
      eager: true,
    },
  )
  services: ServiceToOfferor[];
}
