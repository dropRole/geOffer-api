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
import { PrivilegedRoute } from 'src/auth/privileged-route.decorator';
import ExtractUser from 'src/auth/extract-user.decorator';
import User from 'src/auth/user.entity';
import MakeReservationDTO from './dto/make-reservation.dto';
import Reservation from './reservation.entity';
import ObtainReservationsDTO from './dto/obtain-reservations.dto';

@Controller('reservations')
export class ReservationsController {
  constructor(private reservationsService: ReservationsService) {}

  @Post()
  @PrivilegedRoute('OFFEROR')
  makeReservation(
    @Body() makeReservationDTO: MakeReservationDTO,
  ): Promise<{ id: string }> {
    return;
  }

  @Get()
  @PrivilegedRoute('SUPERUSER', 'OFFEREE', 'OFFEROR')
  obtainReservations(
    @ExtractUser() user: User,
    @Query() obtainReservationsDTO: ObtainReservationsDTO,
  ): Promise<Reservation[]> {
    return;
  }

  @Delete('/:id')
  @PrivilegedRoute('OFFEROR')
  withdrawReservation(@Param('id') id: string): Promise<{ id: string }> {
    return;
  }
}
