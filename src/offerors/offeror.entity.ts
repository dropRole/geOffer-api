import {
  Entity,
  Column,
  OneToOne,
  JoinColumn,
  OneToMany,
  Check,
} from 'typeorm';
import BaseEntity from 'src/base.entity';
import {
  OfferorAddress,
  OfferorBusinessHours,
  OfferorCategory,
  OfferorCoordinates,
  OfferorReputation,
} from './types';
import User from 'src/auth/user.entity';
import Request from 'src/requests/request.entity';
import Image from './image.entity';
import Event from './event.entity';
import ServiceToOfferor from './service-to-offeror.entity';

@Entity('offerors')
export default class Offeror extends BaseEntity {
  @Column({ type: 'text' })
  name: string;

  @Check("category IN('Restaurant', 'Café/Pub', 'Movie Theater')")
  @Column({ type: 'varchar', length: 13 })
  category: OfferorCategory;

  @Column({ type: 'jsonb' })
  address: OfferorAddress;

  @Column({ type: 'jsonb' })
  coordinates: OfferorCoordinates;

  @Column({ type: 'varchar', length: 15 })
  telephone: string;

  @Column({ type: 'varchar', length: 254 })
  email: string;

  @Column({ type: 'jsonb' })
  businessHours: OfferorBusinessHours;

  @Column({
    type: 'jsonb',
    default: {
      responsiveness: 10,
      compliance: 10,
      timeliness: 10,
    },
  })
  reputation: OfferorReputation;

  @OneToOne((_type) => User, {
    eager: true,
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'username' })
  user: User;

  @OneToMany((_type) => Request, (request) => request.offeror)
  requests: Request[];

  @OneToMany((_type) => Image, (offerorImage) => offerorImage.offeror, {
    eager: true,
  })
  images: Image[];

  @OneToMany((_type) => Event, (offerorEvent) => offerorEvent.offeror, {
    eager: true,
  })
  events: Event[];

  @OneToMany(
    (_type) => ServiceToOfferor,
    (offerorService) => offerorService.offeror,
    {
      eager: true,
    },
  )
  services: ServiceToOfferor[];
}
