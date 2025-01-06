import { Module } from '@nestjs/common';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import Request from './entities/request.entity';
import ServiceToRequest from './entities/service-to-request.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Request, ServiceToRequest])],
  controllers: [RequestsController],
  providers: [RequestsService],
})
export class RequestsModule {}
