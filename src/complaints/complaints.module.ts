import { Module } from '@nestjs/common';
import { ComplaintsController } from './complaints.controller';
import { ComplaintsService } from './complaints.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import Complaint from './entities/complaint.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Complaint])],
  controllers: [ComplaintsController],
  providers: [ComplaintsService],
})
export class ComplaintsModule {}
