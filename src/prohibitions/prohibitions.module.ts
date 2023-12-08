import { Module } from '@nestjs/common';
import { ProhibitionsController } from './prohibitions.controller';
import { ProhibitionsService } from './prohibitions.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import Prohibition from './prohibition.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Prohibition])],
  controllers: [ProhibitionsController],
  providers: [ProhibitionsService],
  exports: [ProhibitionsService],
})
export class ProhibitionsModule {}
