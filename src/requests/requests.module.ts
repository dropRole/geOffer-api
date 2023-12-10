import { Module } from '@nestjs/common';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import Request from './request.entity';
import { OfferorsModule } from 'src/offerors/offerors.module';
import { ReservationsModule } from 'src/reservations/reservations.module';
import { OffereesModule } from 'src/offerees/offerees.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Request]),
    OffereesModule,
    OfferorsModule,
    ReservationsModule,
  ],
  controllers: [RequestsController],
  providers: [RequestsService],
})
export class RequestsModule {}
