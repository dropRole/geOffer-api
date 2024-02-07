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
import { PrivilegedRoute } from '../auth/privileged-route.decorator';
import DeclareProhibitionDTO from './dto/declare-prohibition.dto';
import ExtractUser from '../auth/extract-user.decorator';
import Prohibition from './prohibition.entity';
import ObtainProhibitionsDTO from './dto/obtain-prohibitions.dto';
import AlterTimeframeDTO from './dto/alter-timeframe.dto';
import User from '../auth/user.entity';

@Controller('prohibitions')
export class ProhibitionsController {
  constructor(private prohibitionsService: ProhibitionsService) {}

  @Post()
  @PrivilegedRoute('SUPERUSER')
  declareProhibition(
    @Body() declareProhibitionDTO: DeclareProhibitionDTO,
  ): Promise<{ id: string }> {
    return this.prohibitionsService.declareProhibition(declareProhibitionDTO);
  }

  @Get()
  @PrivilegedRoute('SUPERUSER', 'OFFEREE', 'OFFEROR')
  obtainProhibitions(
    @ExtractUser() user: User,
    @Query() obtainProhibitionsDTO: ObtainProhibitionsDTO,
  ): Promise<Prohibition[]> {
    return this.prohibitionsService.obtainProhibitions(
      user,
      obtainProhibitionsDTO,
    );
  }

  @Patch('/:id/timeframe')
  @PrivilegedRoute('SUPERUSER')
  alterTimeframe(
    @Param('id') id: string,
    @Body() alterTimeframeDTO: AlterTimeframeDTO,
  ): Promise<{ id: string }> {
    return this.prohibitionsService.alterTimeframe(id, alterTimeframeDTO);
  }

  @Delete('/:id')
  @PrivilegedRoute('SUPERUSER')
  disdeclareProhibition(@Param('id') id: string): Promise<{ id: string }> {
    return this.prohibitionsService.disdeclareProhibition(id);
  }
}
