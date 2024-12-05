import { Module, forwardRef } from '@nestjs/common';
import { OfferorsController } from './offerors.controller';
import { OfferorsService } from './offerors.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import Offeror from './offeror.entity';
import OfferorImage from './offeror-images.entity';
import { OfferorEvent } from './offeror-event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Offeror, OfferorImage, OfferorEvent])],
  controllers: [OfferorsController],
  providers: [OfferorsService],
  exports: [OfferorsService],
})
export class OfferorsModule {}
