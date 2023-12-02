import { Module } from '@nestjs/common';
import { DataLoggerService } from './data-logger.service';

@Module({
  providers: [DataLoggerService]
})
export class DataLoggerModule {}
