import { Injectable } from '@nestjs/common';
import BaseService from 'src/base.service';
import Offeror from './offeror.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class OfferorsService extends BaseService<Offeror> {
  constructor(
    @InjectRepository(Offeror)
    offerorsRepo: Repository<Offeror>,
  ) {
    super(offerorsRepo);
  }
}
