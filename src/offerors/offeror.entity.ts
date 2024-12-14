import { Entity, Column, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import BaseEntity from 'src/base.entity';
import {
  OfferorAddress,
  OfferorBusinessHours,
  OfferorCoordinates,
  OfferorReputation,
  OfferorService,
} from './types';
import User from 'src/auth/user.entity';
import Request from 'src/requests/request.entity';
import OfferorImage from './offeror-images.entity';
import { OfferorEvent } from './offeror-event.entity';

@Entity('offerors')
export default class Offeror extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'jsonb' })
  address: OfferorAddress;

  @Column({ type: 'jsonb' })
  coordinates: OfferorCoordinates;

  @Column({ type: 'varchar', length: 15 })
  telephone: string;

  @Column({ type: 'varchar', length: 254 })
  email: string;

  @Column({ type: 'jsonb' })
  service: OfferorService;

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

  @OneToMany((_type) => OfferorImage, (offerorImage) => offerorImage.offeror, {
    eager: true,
  })
  images: OfferorImage[];

  @OneToMany((_type) => OfferorEvent, (offerorEvent) => offerorEvent.offeror, {
    eager: true,
  })
  events: OfferorEvent[];
}
