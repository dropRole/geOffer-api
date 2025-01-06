import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ProhibitionsService } from './prohibitions.service';
import { PrivilegedRoute } from '../common/decorators/privileged-route.decorator';
import DeclareProhibitionDTO from './dto/declare-prohibition.dto';
import CurrentUser from 'src/auth/current-user.decorator';
import Prohibition from './entities/prohibition.entity';
import ObtainProhibitionsDTO from './dto/obtain-prohibitions.dto';
import AlterTimeframeDTO from './dto/alter-timeframe.dto';
import { User } from '../auth/entities/user.entity';

@Controller('prohibitions')
export class ProhibitionsController {
  constructor(private prohibitionsService: ProhibitionsService) {}

  @Post()
  @PrivilegedRoute('SUPERUSER')
  declareProhibition(
    @Body() declareProhibitionDTO: DeclareProhibitionDTO,
  ): Promise<{ id: string }> {
    return;
  }

  @Get()
  @PrivilegedRoute('SUPERUSER', 'OFFEREE', 'OFFEROR')
  obtainProhibitions(
    @CurrentUser() user: User,
    @Query() obtainProhibitionsDTO: ObtainProhibitionsDTO,
  ): Promise<Prohibition[]> {
    return;
  }

  @Patch('/:id/timeframe')
  @PrivilegedRoute('SUPERUSER')
  alterTimeframe(
    @Param('id') id: string,
    @Body() alterTimeframeDTO: AlterTimeframeDTO,
  ): Promise<{ id: string }> {
    return;
  }

  @Delete('/:id')
  @PrivilegedRoute('SUPERUSER')
  disdeclareProhibition(@Param('id') id: string): Promise<{ id: string }> {
    return;
  }
}
