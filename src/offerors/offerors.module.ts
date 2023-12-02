import { Module } from '@nestjs/common';
import { OfferorsController } from './offerors.controller';
import { OfferorsService } from './offerors.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import Offeror from './offeror.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Offeror])],
  controllers: [OfferorsController],
  providers: [OfferorsService],
})
export class OfferorsModule {}
