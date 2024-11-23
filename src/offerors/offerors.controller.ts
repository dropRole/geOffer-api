import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Patch,
  Param,
} from '@nestjs/common';
import { OfferorsService } from './offerors.service';
import { PrivilegedRoute } from 'src/auth/privileged-route.decorator';
import RecordOfferorDTO from './dto/record-offeror.dto';
import Offeror from './offeror.entity';
import ObtainOfferorsDTO from './dto/obtain-offerors.dto';
import ExtractUser from 'src/auth/extract-user.decorator';
import { OfferorReputation } from './types';
import AmendBusinessInfoDTO from './dto/amend-business-info.dto';
import AlterReputationDTO from './dto/alter-reputation.dto';
import User from 'src/auth/user.entity';

@Controller('offerors')
export class OfferorsController {
  constructor(private offerorsService: OfferorsService) {}

  @Post()
  @PrivilegedRoute('SUPERUSER')
  recordOfferor(
    @Body() recordOfferorDTO: RecordOfferorDTO,
  ): Promise<{ id: string }> {
    return;
  }

  @Get()
  @PrivilegedRoute('SUPERUSER', 'OFFEREE')
  obtainOfferors(
    @Query() obtainOfferorsDTO: ObtainOfferorsDTO,
  ): Promise<Offeror[]> {
    return;
  }

  @Get('/business-info')
  @PrivilegedRoute('OFFEROR')
  claimBusinessInfo(
    @ExtractUser() user: User,
  ): Promise<Omit<Offeror, 'id' | 'reputation' | 'user' | 'requests'>> {
    return;
  }

  @Get('/reputation')
  @PrivilegedRoute('OFFEROR')
  claimReputation(@ExtractUser() user: User): Promise<OfferorReputation> {
    return;
  }

  @Patch('/business-info')
  @PrivilegedRoute('OFFEROR')
  amendBusinessInfo(
    @ExtractUser() user: User,
    @Body() amendBusinessInfoDTO: AmendBusinessInfoDTO,
  ): Promise<void> {
    return;
  }

  @Patch('/:id/reputation')
  @PrivilegedRoute('SUPERUSER')
  alterReputation(
    @Param('id') id: string,
    @Body() alterReputationDTO: AlterReputationDTO,
  ): Promise<{ id: string }> {
    return;
  }
}
