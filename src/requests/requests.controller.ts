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
import { PrivilegedRoute } from '../common/decorators/privileged-route.decorator';
import CurrentUser from 'src/auth/current-user.decorator';
import { User } from '../auth/entities/user.entity';
import MakeRequestDTO from './dto/make-request.dto';
import Request from './entities/request.entity';
import ObtainRequestsDTO from './dto/obtain-requests.dto';
import AmendRequestProvisionsDTO from './dto/amend-request-provisions.dto';
import AssessReservationTimeDTO from './dto/assess-reservation-time.dto';

@Controller('requests')
export class RequestsController {
  constructor(private requestsService: RequestsService) {}

  @Post()
  @PrivilegedRoute('OFFEREE')
  makeRequest(
    @CurrentUser() user: User,
    @Body() makeRequestDTO: MakeRequestDTO,
  ): Promise<{ id: string }> {
    return;
  }

  @Get()
  @PrivilegedRoute('OFFEREE', 'OFFEROR')
  obtainRequests(
    @CurrentUser() user: User,
    @Query() obtainRequestsDTO: ObtainRequestsDTO,
  ): Promise<Request[]> {
    return;
  }

  @Patch('/:id/provisions')
  @PrivilegedRoute('OFFEREE')
  amendRequestProvisions(
    @Param('id') id: string,
    @Body() amendRequestProvisionsDTO: AmendRequestProvisionsDTO,
  ): Promise<{ id: string }> {
    return;
  }

  @Patch('/:id/assessment')
  @PrivilegedRoute('OFFEROR')
  assessReservationTime(
    @Param('id') id: string,
    @Body() assessReservationTimeDTO: AssessReservationTimeDTO,
  ): Promise<{ id: string }> {
    return;
  }

  @Delete('/:id')
  @PrivilegedRoute('OFFEREE')
  revokeRequest(@Param('id') id: string): Promise<{ id: string }> {
    return;
  }
}
