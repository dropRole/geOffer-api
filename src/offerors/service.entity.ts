import BaseEntity from 'src/base.entity';
import { Check, Column, Entity, OneToMany } from 'typeorm';
import { OfferorServiceCategory } from './types';
import ServiceToOfferor from './service-to-offeror.entity';

@Entity('services')
export default class Service extends BaseEntity {
  @Check("category IN('Seat reservation', 'Ticket selling')")
  @Column({ type: 'varchar', length: 16 })
  category: OfferorServiceCategory;

  @Column({ type: 'text', nullable: true })
  detailed: string;

  @OneToMany(
    (_type) => ServiceToOfferor,
    (offerorService) => offerorService.service,
    {
      eager: true,
    },
  )
  offerors: ServiceToOfferor[];
}
