import {
  Body,
  Controller,
  Post,
  Get,
  Query,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { RequestsService } from './requests.service';
import { PrivilegedRoute } from 'src/auth/privileged-route.decorator';
import ExtractUser from 'src/auth/extract-user.decorator';
import User from 'src/auth/user.entity';
import MakeRequestDTO from './dto/make-request.dto';
import Request from './request.entity';
import ObtainRequestsDTO from './dto/obtain-requests.dto';
import AmendRequestProvisionsDTO from './dto/amend-request-provisions.dto';
import AssessReservationTimeDTO from './dto/assess-reservation-time.dto';

@Controller('requests')
export class RequestsController {
  constructor(private requestsService: RequestsService) {}

  @Post()
  @PrivilegedRoute('OFFEREE')
  makeRequest(
    @ExtractUser() user: User,
    @Body() makeRequestDTO: MakeRequestDTO,
  ): Promise<{ id: string }> {
    return this.requestsService.makeRequest(user, makeRequestDTO);
  }

  @Get()
  @PrivilegedRoute('OFFEREE', 'OFFEROR')
  obtainRequests(
    @ExtractUser() user: User,
    @Query() obtainRequestsDTO: ObtainRequestsDTO,
  ): Promise<Request[]> {
    return this.requestsService.obtainRequests(user, obtainRequestsDTO);
  }

  @Patch('/:id/provisions')
  @PrivilegedRoute('OFFEREE')
  amendRequestProvisions(
    @Param('id') id: string,
    @ExtractUser()
    user: User,
    @Body() amendRequestProvisionsDTO: AmendRequestProvisionsDTO,
  ): Promise<{ id: string }> {
    return this.requestsService.amendRequestProvisions(
      user,
      id,
      amendRequestProvisionsDTO,
    );
  }

  @Patch('/:id/assessment')
  @PrivilegedRoute('OFFEROR')
  assessReservationTime(
    @Param('id') id: string,
    @ExtractUser() user: User,
    @Body() assessReservationTimeDTO: AssessReservationTimeDTO,
  ): Promise<{ id: string }> {
    return this.requestsService.assessReservationTime(
      user,
      id,
      assessReservationTimeDTO,
    );
  }

  @Delete('/:id')
  @PrivilegedRoute('OFFEREE')
  revokeRequest(
    @Param('id') id: string,
    @ExtractUser() user: User,
  ): Promise<{ id: string }> {
    return this.requestsService.revokeRequest(user, id);
  }
}
