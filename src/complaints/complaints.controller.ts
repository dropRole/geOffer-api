import {
  Body,
  Controller,
  Post,
  Get,
  Param,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';
import { ComplaintsService } from './complaints.service';
import { PrivilegedRoute } from '../common/decorators/privileged-route.decorator';
import CurrentUser from 'src/auth/current-user.decorator';
import { User } from 'src/auth/entities/user.entity';
import WriteComplaintDTO from './dto/write-complaint.dto';
import Complaint from './entities/complaint.entity';
import ObtainComplaintsDTO from './dto/obtain-complaints.dto';
import RewriteComplaintDTO from './dto/rewrite-complaint.dto';

@Controller('complaints')
export class ComplaintsController {
  constructor(private complaintsService: ComplaintsService) {}

  @Post()
  @PrivilegedRoute('OFFEREE', 'OFFEROR')
  writeComplaint(
    @CurrentUser() user: User,
    @Body() writeComplaintDTO: WriteComplaintDTO,
  ): Promise<{ id: string }> {
    return;
  }

  @Get('/:idIncident')
  @PrivilegedRoute('SUPERUSER', 'OFFEREE', 'OFFEROR')
  obtainComplaints(
    @Param('idIncident') idIncident: string,
    @Query() obtainComplaintsDTO: ObtainComplaintsDTO,
  ): Promise<Complaint[]> {
    return;
  }

  @Patch('/:id/content')
  @PrivilegedRoute('OFFEREE', 'OFFEROR')
  rewriteComplaint(
    @Param('id') id: string,
    @Body() rewriteComplaintDTO: RewriteComplaintDTO,
  ): Promise<{ id: string }> {
    return;
  }

  @Delete('/:id')
  @PrivilegedRoute('OFFEREE', 'OFFEROR')
  withdrawComplaint(@Param('id') id: string): Promise<{ id: string }> {
    return;
  }
}
