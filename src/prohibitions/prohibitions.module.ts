import { Module } from '@nestjs/common';
import { ProhibitionsController } from './prohibitions.controller';
import { ProhibitionsService } from './prohibitions.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import Prohibition from './entities/prohibition.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Prohibition])],
  controllers: [ProhibitionsController],
  providers: [ProhibitionsService],
})
export class ProhibitionsModule {}
