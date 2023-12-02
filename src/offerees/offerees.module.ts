import { Module } from '@nestjs/common';
import { OffereesController } from './offerees.controller';
import { OffereesService } from './offerees.service';

@Module({
  controllers: [OffereesController],
  providers: [OffereesService]
})
export class OffereesModule {}
