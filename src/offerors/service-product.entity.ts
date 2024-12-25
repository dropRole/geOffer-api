import BaseEntity from 'src/base.entity';
import {
  Check,
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { OfferorServiceCategory, OfferorServiceSubcategory } from './types';
import { ServiceToOfferor } from './service-to-offeror';

@Entity('servicesProducts')
export class ServiceProduct extends BaseEntity {
  @Column({ type: 'text' })
  serviceProduct: string;

  @Check(
    "category IN('Restaurant', 'Café/Pub', 'Movie Theater', 'Dinning', 'Drink order', 'Ticket selling')",
  )
  @Column({ type: 'varchar', length: 14 })
  category: OfferorServiceCategory | OfferorServiceSubcategory;

  @Column({ type: 'text', nullable: true })
  detailed: string;

  @OneToOne((_type) => ServiceProduct, {
    createForeignKeyConstraints: false,
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'idServiceProduct' })
  belongingServiceProduct: ServiceProduct;

  @OneToMany(
    (_type) => ServiceToOfferor,
    (offerorServiceProduct) => offerorServiceProduct.serviceProduct,
    {
      eager: true,
    },
  )
  offerors: ServiceToOfferor[];
}
