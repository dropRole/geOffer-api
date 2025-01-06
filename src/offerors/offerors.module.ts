import { Module, forwardRef } from '@nestjs/common';
import { OfferorsController } from './offerors.controller';
import { OfferorsService } from './offerors.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Offeror } from './entities/offeror.entity';
import Image from './entities/image.entity';
import Event from './entities/event.entity';
import { Service } from './entities/service.entity';
import ServiceToOfferor from './entities/service-to-offeror.entity';
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
