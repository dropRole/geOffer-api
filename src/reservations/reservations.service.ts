import { Injectable } from '@nestjs/common';
import BaseService from 'src/base.service';
import Reservation from './reservation.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ReservationsService extends BaseService<Reservation> {
  constructor(
    @InjectRepository(Reservation)
    reservationsRepo: Repository<Reservation>,
  ) {
    super(reservationsRepo);
  }
}
