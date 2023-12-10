import { Injectable } from '@nestjs/common';
import BaseService from 'src/base.service';
import Reservation from './reservation.entity';

@Injectable()
export class ReservationsService extends BaseService<Reservation> {}
