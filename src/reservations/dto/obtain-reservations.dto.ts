import {
  IsOptional,
  IsUUID,
  IsIn,
  IsNotEmpty,
  IsNumberString,
} from 'class-validator';
import { ReservationPeriod } from '../types';

export default class ObtainReservationsDTO {
  @IsOptional()
  @IsUUID()
  idOfferee: string;

  @IsOptional()
  @IsUUID()
  idOfferor: string;

  @IsIn(['TODAY', 'WEEK', 'MONTH'])
  reservationPeriod: ReservationPeriod;

  @IsIn(['ASC', 'DESC'])
  reservedOrder: 'ASC' | 'DESC' = 'ASC';

  @IsNotEmpty()
  @IsNumberString()
  take: number;
}
