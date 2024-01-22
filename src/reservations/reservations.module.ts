import { Module, forwardRef } from '@nestjs/common';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import Reservation from './reservation.entity';
import { RequestsModule } from 'src/requests/requests.module';
import { IncidentsModule } from 'src/incidents/incidents.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reservation]),
    forwardRef(() => RequestsModule),
    forwardRef(() => IncidentsModule),
  ],
  controllers: [ReservationsController],
  providers: [ReservationsService],
  exports: [ReservationsService],
})
export class ReservationsModule {}
