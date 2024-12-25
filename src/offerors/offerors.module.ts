import { Module } from '@nestjs/common';
import { OfferorsController } from './offerors.controller';
import { OfferorsService } from './offerors.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import Offeror from './offeror.entity';
import Image from './image.entity';
import { Event } from './event.entity';
import { ServiceProduct } from './service-product.entity';
import { ServiceToOfferor } from './service-to-offeror';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Offeror,
      Image,
      Event,
      ServiceProduct,
      ServiceToOfferor,
    ]),
  ],
  controllers: [OfferorsController],
  providers: [OfferorsService],
})
export class OfferorsModule {}
