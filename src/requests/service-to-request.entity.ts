import BaseEntity from 'src/base.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import Request from './request.entity';
import ServiceToOfferor from 'src/offerors/service-to-offeror.entity';

@Entity('requestsOfferorsServices')
export default class ServiceToRequest extends BaseEntity {
  @Column({ type: 'smallint' })
  amount: number;

  @ManyToOne((_type) => Request, (request) => request.services, {
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
  @JoinColumn({ name: 'idOfferorService' })
  serviceToOfferor: ServiceToOfferor;
}
