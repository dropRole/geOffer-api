import { Module, forwardRef } from '@nestjs/common';
import { OfferorsController } from './offerors.controller';
import { OfferorsService } from './offerors.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import Offeror from './offeror.entity';
import OfferorImage from './offeror-images.entity';
import { OfferorEvent } from './offeror-event.entity';
import { AuthModule } from 'src/auth/auth.module';
import { ReservationsModule } from 'src/reservations/reservations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Offeror, OfferorImage, OfferorEvent]),
    AuthModule,
    ReservationsModule,
  ],
  controllers: [OfferorsController],
  providers: [OfferorsService],
  exports: [OfferorsService],
})
export class OfferorsModule {}
