import { Module } from '@nestjs/common';
import { OffereesController } from './offerees.controller';
import { OffereesService } from './offerees.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import Offeree from './offeree.entity';
import { ProhibitionsModule } from 'src/prohibitions/prohibitions.module';

@Module({
  imports: [TypeOrmModule.forFeature([Offeree]), ProhibitionsModule],
  controllers: [OffereesController],
  providers: [OffereesService],
})
export class OffereesModule {}
