import { Module } from '@nestjs/common';
import { ComplaintsController } from './complaints.controller';
import { ComplaintsService } from './complaints.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import Complaint from './entities/complaint.entity';
import { IncidentsModule } from 'src/incidents/incidents.module';

@Module({
  imports: [TypeOrmModule.forFeature([Complaint]), IncidentsModule],
  controllers: [ComplaintsController],
  providers: [ComplaintsService],
})
export class ComplaintsModule {}
