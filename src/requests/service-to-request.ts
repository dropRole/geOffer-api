import BaseEntity from 'src/base.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import Request from './request.entity';
import { ServiceToOfferor } from 'src/offerors/service-to-offeror';

@Entity('requestsOfferorsServicesProducts')
export class ServiceToRequest extends BaseEntity {
  @Column({ type: 'smallint' })
  amount: number;

  @ManyToOne((_type) => Request, (request) => request.servicesProducts, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'idRequest' })
  request: Request;

  @ManyToOne(
    (_type) => ServiceToOfferor,
    (serviceToOfferor) => serviceToOfferor.serviceRequests,
    {
      onDelete: 'RESTRICT',
    },
  )
  @JoinColumn({ name: 'idOfferorServiceProduct' })
  serviceToOfferor: ServiceToOfferor;
}
