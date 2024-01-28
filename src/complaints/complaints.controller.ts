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
import { PrivilegedRoute } from 'src/auth/privileged-route.decorator';
import ExtractUser from 'src/auth/extract-user.decorator';
import User from 'src/auth/user.entity';
import WriteComplaintDTO from './dto/write-complaint.dto';
import Complaint from './complaint.entity';
import ObtainComplaintsDTO from './dto/obtain-complaints.dto';
import RewriteComplaintDTO from './dto/rewrite-complaint.dto';

@Controller('complaints')
export class ComplaintsController {
  constructor(private complaintsService: ComplaintsService) {}

  @Post()
  @PrivilegedRoute('OFFEREE', 'OFFEROR')
  writeComplaint(
    @ExtractUser() user: User,
    @Body() writeComplaintDTO: WriteComplaintDTO,
  ): Promise<{ id: string }> {
    return this.complaintsService.writeComplaint(user, writeComplaintDTO);
  }

  @Get('/:idIncident')
  @PrivilegedRoute('SUPERUSER', 'OFFEREE', 'OFFEROR')
  obtainComplaints(
    @ExtractUser() user: User,
    @Param('idIncident') idIncident: string,
    @Query() obtainComplaintsDTO: ObtainComplaintsDTO,
  ): Promise<Complaint[]> {
    return this.complaintsService.obtainComplaints(
      user,
      idIncident,
      obtainComplaintsDTO,
    );
  }

  @Patch('/:id/content')
  @PrivilegedRoute('OFFEREE', 'OFFEROR')
  rewriteComplaint(
    @ExtractUser() user: User,
    @Param('id') id: string,
    @Body() rewriteComplaintDTO: RewriteComplaintDTO,
  ): Promise<{ id: string }> {
    return this.complaintsService.rewriteComplaint(
      user,
      id,
      rewriteComplaintDTO,
    );
  }

  @Delete('/:id')
  @PrivilegedRoute('OFFEREE', 'OFFEROR')
  withdrawComplaint(
    @ExtractUser() user: User,
    @Param('id') id: string,
  ): Promise<{ id: string }> {
    return this.complaintsService.withdrawComplaint(user, id);
  }
}
