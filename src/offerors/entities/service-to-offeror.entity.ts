import BaseEntity from '../../common/entities/base.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { Offeror } from './offeror.entity';
import { Service } from './service.entity';
import Event from './event.entity';
import ServiceToRequest from '../../requests/entities/service-to-request.entity';

@Entity('offerorsServices')
export default class ServiceToOfferor extends BaseEntity {
  @Column({ type: 'numeric', precision: 6, scale: 2 })
  price: number;

  @ManyToOne((_type) => Offeror, (offeror) => offeror.services, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'idOfferor' })
  offeror: Offeror;

  @ManyToOne((_type) => Service, (service) => service.offerors, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'idService' })
  service: Service;

  @ManyToOne((_type) => Event, (event) => event.services, {
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
