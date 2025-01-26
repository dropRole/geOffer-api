import BaseEntity from '../../common/entities/base.entity';
import { Column, Entity, OneToMany } from 'typeorm';
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
