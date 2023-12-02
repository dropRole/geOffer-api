import { Module } from '@nestjs/common';
import { LocationiqController } from './locationiq.controller';
import { LocationiqService } from './locationiq.service';

@Module({
  controllers: [LocationiqController],
  providers: [LocationiqService]
})
export class LocationiqModule {}
