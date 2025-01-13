import {
  Body,
  Controller,
  Post,
  Get,
  Query,
  Delete,
  Param,
} from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { PrivilegedRoute } from '../common/decorators/privileged-route.decorator';
import CurrentUser from 'src/auth/current-user.decorator';
import { User } from '../auth/entities/user.entity';
import MakeReservationDTO from './dto/make-reservation.dto';
import Reservation from './entities/reservation.entity';
import ObtainReservationsDTO from './dto/obtain-reservations.dto';

@Controller('reservations')
export class ReservationsController {
  constructor(private reservationsService: ReservationsService) {}

  @Post()
  @PrivilegedRoute('OFFEROR')
  makeReservation(
    @Body() makeReservationDTO: MakeReservationDTO,
  ): Promise<{ id: string }> {
    return this.reservationsService.makeReservation(makeReservationDTO);
  }

  @Get()
  @PrivilegedRoute('SUPERUSER', 'OFFEREE', 'OFFEROR')
  obtainReservations(
    @CurrentUser() user: User,
    @Query() obtainReservationsDTO: ObtainReservationsDTO,
  ): Promise<{ reservations: Reservation[]; count: number }> {
    return this.reservationsService.obtainReservations(
      user,
      obtainReservationsDTO,
    );
  }

  @Delete('/:id')
  @PrivilegedRoute('OFFEROR')
  withdrawReservation(@Param('id') id: string): Promise<{ id: string }> {
    return this.reservationsService.withdrawReservation(id);
  }
}
