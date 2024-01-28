import { Module } from '@nestjs/common';
import { ProhibitionsController } from './prohibitions.controller';
import { ProhibitionsService } from './prohibitions.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import Prohibition from './prohibition.entity';
import { IncidentsModule } from 'src/incidents/incidents.module';
import { BullModule } from '@nestjs/bull';
import { ProhibitionsConsumer } from './prohibitions.consumer';
import { DataLoggerModule } from 'src/data-logger/data-logger.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Prohibition]),
    IncidentsModule,
    BullModule.registerQueue({ name: 'prohibitions' }),
    DataLoggerModule,
  ],
  controllers: [ProhibitionsController],
  providers: [ProhibitionsService, ProhibitionsConsumer],
  exports: [ProhibitionsService],
})
export class ProhibitionsModule {}
