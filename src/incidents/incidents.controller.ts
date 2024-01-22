import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  Patch,
  Delete,
} from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { PrivilegedRoute } from 'src/auth/privileged-route.decorator';
import ExtractUser from 'src/auth/extract-user.decorator';
import OpenIncidentDTO from './dto/open-incident.dto';
import Incident from './incident.entity';
import ObtainIncidentsDTO from './dto/obtain-incidents.dto';
import RenameIncidentDTO from './dto/rename-incident.dto';
import AlterIncidentStatusDTO from './dto/alter-incident-status.dto';
import User from 'src/auth/user.entity';

@Controller('incidents')
export class IncidentsController {
  constructor(private incidentsService: IncidentsService) {}

  @Post()
  @PrivilegedRoute('OFFEREE', 'OFFEROR')
  openIncident(
    @ExtractUser() user: User,
    @Body() openIncidentDTO: OpenIncidentDTO,
  ): Promise<{ id: string }> {
    return this.incidentsService.openIncident(user, openIncidentDTO);
  }

  @Get('/:idReservation')
  @PrivilegedRoute('SUPERUSER', 'OFFEREE', 'OFFEROR')
  obtainIncidents(
    @ExtractUser() user: User,
    @Param('idReservation') idReservation: string,
    @Query() obtainIncidentsDTO: ObtainIncidentsDTO,
  ): Promise<Incident[]> {
    return this.incidentsService.obtainIncidents(
      user,
      idReservation,
      obtainIncidentsDTO,
    );
  }

  @Patch('/:id/title')
  @PrivilegedRoute('OFFEREE', 'OFFEROR')
  renameIncident(
    @ExtractUser() user: User,
    @Param('id') id: string,
    @Body() renameIncidentDTO: RenameIncidentDTO,
  ): Promise<{ id: string }> {
    return this.incidentsService.renameIncident(user, id, renameIncidentDTO);
  }

  @Patch('/:id/status')
  @PrivilegedRoute('SUPERUSER')
  alterIncidentStatus(
    @Param('id') id: string,
    @Body() alterIncidentStatusDTO: AlterIncidentStatusDTO,
  ): Promise<{ id: string }> {
    return this.incidentsService.alterIncidentStatus(
      id,
      alterIncidentStatusDTO,
    );
  }

  @Delete('/:id')
  @PrivilegedRoute('SUPERUSER', 'OFFEREE', 'OFFEROR')
  closeIncident(
    @ExtractUser() user: User,
    @Param('id') id: string,
  ): Promise<{ id: string }> {
    return this.incidentsService.closeIncident(user, id);
  }
}
