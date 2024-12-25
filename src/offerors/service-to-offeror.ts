import BaseEntity from 'src/base.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import Offeror from './offeror.entity';
import { ServiceProduct } from './service-product.entity';
import { Event } from './event.entity';
import { ServiceToRequest } from 'src/requests/service-to-request';

@Entity('offerorsServicesProducts')
export class ServiceToOfferor extends BaseEntity {
  @Column({ type: 'numeric' })
  price: number;

  @ManyToOne((_type) => Offeror, (offeror) => offeror.servicesProducts, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'idOfferor' })
  offeror: Offeror;

  @ManyToOne(
    (_type) => ServiceProduct,
    (serviceProduct) => serviceProduct.offerors,
    {
      onDelete: 'RESTRICT',
    },
  )
  @JoinColumn({ name: 'idServiceProduct' })
  serviceProduct: ServiceProduct;

  @ManyToOne((_type) => Event, (event) => event.servicesProducts, {
    onDelete: 'RESTRICT',
    nullable: true,
  })
  @JoinColumn({ name: 'idEvent' })
  event: Event;

  @OneToMany(
    (_type) => ServiceToRequest,
    (serviceToRequest) => serviceToRequest.serviceToOfferor,
    { eager: true },
  )
  serviceRequests: ServiceToRequest[];
}
