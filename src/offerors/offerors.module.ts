import { Module, forwardRef } from '@nestjs/common';
import { OfferorsController } from './offerors.controller';
import { OfferorsService } from './offerors.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import Offeror from './offeror.entity';
import Image from './image.entity';
import Event from './event.entity';
import Service from './service.entity';
import ServiceToOfferor from './service-to-offeror.entity';
import { AuthModule } from 'src/auth/auth.module';
import { ReservationsModule } from 'src/reservations/reservations.module';
import { RequestsModule } from 'src/requests/requests.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Offeror,
      Image,
      Event,
      Service,
      ServiceToOfferor,
    ]),
    AuthModule,
    ReservationsModule,
    forwardRef(() => RequestsModule),
  ],
  controllers: [OfferorsController],
  providers: [OfferorsService],
  exports: [OfferorsService],
})
export class OfferorsModule {}
