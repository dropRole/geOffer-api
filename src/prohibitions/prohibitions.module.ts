import { Module } from '@nestjs/common';
import { ProhibitionsController } from './prohibitions.controller';
import { ProhibitionsService } from './prohibitions.service';

@Module({
  controllers: [ProhibitionsController],
  providers: [ProhibitionsService]
})
export class ProhibitionsModule {}
