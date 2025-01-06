import { Module } from '@nestjs/common';
import { OfferorsController } from './offerors.controller';
import { OfferorsService } from './offerors.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Offeror } from './entities/offeror.entity';
import Image from './entities/image.entity';
import Event from './entities/event.entity';
import Service from './entities/service.entity';
import ServiceToOfferor from './entities/service-to-offeror.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Offeror,
      Image,
      Event,
      Service,
      ServiceToOfferor,
    ]),
  ],
  controllers: [OfferorsController],
  providers: [OfferorsService],
})
export class OfferorsModule {}
