import BaseEntity from 'src/common/entities/base.entity';
import { Check, Column, Entity, OneToMany } from 'typeorm';
import ServiceToOfferor from './service-to-offeror.entity';

type ServiceCategory = 'Seat reservation' | 'Ticket selling';

@Entity('services')
export default class Service extends BaseEntity {
  @Check("category IN('Seat reservation', 'Ticket selling')")
  @Column({ type: 'varchar', length: 16 })
  category: ServiceCategory;

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
